// Backend simulado (mock) de ui-batch-latam-backend para desarrollo local, sin dependencias.
//
//   npm run mock:api                        -> http://localhost:8080 con 2 s de demora
//   MOCK_DELAY_MS=0 npm run mock:api        -> sin demora (PowerShell: $env:MOCK_DELAY_MS=0; npm run mock:api)
//   MOCK_PORT=8081 npm run mock:api         -> otro puerto
//
// Los datos iniciales están en mock-api/data/*.json. Los procesos creados con POST se guardan
// en memoria mientras el mock esté corriendo (al reiniciarlo vuelve a los datos iniciales).
// Igual que el backend real, responde 401 si no llega "Authorization: Bearer <token>".
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const PORT = Number(process.env.MOCK_PORT ?? 8080);
const DELAY_MS = Number(process.env.MOCK_DELAY_MS ?? 2000);
const DATA_DIR = fileURLToPath(new URL('./data/', import.meta.url));

/** Lee un JSON de mock-api/data en cada request (se puede editar sin reiniciar). */
const readData = (file) => JSON.parse(readFileSync(`${DATA_DIR}${file}`, 'utf8'));

/** "Base de datos" en memoria de procesos batch (inicializada desde batch-processes.json). */
const processes = readData('batch-processes.json');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Lee organization/orchestration de los headers (requeridos por los endpoints de procesos). */
function contextFrom(req) {
  const organization = req.headers.organization;
  const orchestration = req.headers.orchestration;
  return organization && orchestration ? { organization, orchestration } : null;
}

const MISSING_CONTEXT = { status: 400, body: { message: 'Faltan los headers organization y orchestration.' } };

/** "METHOD ruta" -> handler(req, body) que devuelve { status, body }. Agrega aquí cada endpoint nuevo. */
const ROUTES = {
  'GET /ui-batch-latam-backend/api/organizations': () => ({ status: 200, body: readData('organizations.json') }),

  'GET /ui-batch-latam-backend/api/listall': (req) => {
    const context = contextFrom(req);
    if (!context) return MISSING_CONTEXT;
    const list = processes.filter(
      (p) => p.organization === context.organization && p.orchestration === context.orchestration,
    );
    return { status: 200, body: list };
  },

  'POST /ui-batch-latam-backend/api/batch-processes': (req, body) => {
    const context = contextFrom(req);
    if (!context) return MISSING_CONTEXT;
    if (!body?.filename || !Number.isInteger(body.recordsQuantity) || body.recordsQuantity <= 0) {
      return { status: 400, body: { message: 'Body inválido: se espera { filename, recordsQuantity > 0 }.' } };
    }
    const created = {
      id: Math.max(0, ...processes.map((p) => p.id)) + 1,
      fileName: body.filename,
      fileProcess: null,
      recordsQuantity: body.recordsQuantity,
      createdAt: new Date().toISOString(),
      processDate: null,
      processEndDate: null,
      uuid: null,
      statusCode: '001',
      status: 'PENDIENTE',
      ...context,
      hasErrors: null,
      errorFilename: null,
      hasSuccess: null,
      successFilename: null,
    };
    processes.push(created);
    // Igual que el backend real: la respuesta del POST trae solo algunos campos.
    const { id, fileName, recordsQuantity, statusCode, status, organization, orchestration } = created;
    return { status: 200, body: { id, fileName, recordsQuantity, statusCode, status, organization, orchestration } };
  },
};

function send(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type, organization, orchestration',
  });
  res.end(body === undefined ? '' : JSON.stringify(body));
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const text = Buffer.concat(chunks).toString('utf8');
  return text ? JSON.parse(text) : undefined;
}

createServer(async (req, res) => {
  const path = (req.url ?? '').split('?')[0];
  const key = `${req.method} ${path}`;
  const started = Date.now();
  const log = (status) => console.log(`${new Date().toLocaleTimeString()}  ${key}  -> ${status} (${Date.now() - started} ms)`);

  if (req.method === 'OPTIONS') {
    send(res, 204);
    return;
  }

  await sleep(DELAY_MS);

  const handler = ROUTES[key];
  if (!handler) {
    send(res, 404, { message: `Ruta no simulada: ${key}` });
    log(404);
    return;
  }
  if (!/^Bearer\s+\S+/.test(req.headers.authorization ?? '')) {
    send(res, 401, { message: 'Falta el token (Authorization: Bearer ...)' });
    log(401);
    return;
  }

  try {
    const { status, body } = handler(req, await readBody(req));
    send(res, status, body);
    log(status);
  } catch (error) {
    send(res, 500, { message: error.message });
    log(500);
  }
}).listen(PORT, () => {
  console.log(`Mock de ui-batch-latam-backend en http://localhost:${PORT} (demora: ${DELAY_MS} ms)`);
  Object.keys(ROUTES).forEach((route) => console.log(`  ${route}`));
});
