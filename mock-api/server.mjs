// Backend simulado (mock) de ui-batch-latam-backend para desarrollo local, sin dependencias.
//
//   npm run mock:api                        -> http://localhost:8080 con 2 s de demora
//   MOCK_DELAY_MS=0 npm run mock:api        -> sin demora (PowerShell: $env:MOCK_DELAY_MS=0; npm run mock:api)
//   MOCK_PORT=8081 npm run mock:api         -> otro puerto
//
// Las respuestas son archivos JSON en mock-api/data/. Se leen en cada request:
// puedes editarlos sin reiniciar el servidor.
// Igual que el backend real, responde 401 si no llega "Authorization: Bearer <token>".
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const PORT = Number(process.env.MOCK_PORT ?? 8080);
const DELAY_MS = Number(process.env.MOCK_DELAY_MS ?? 2000);
const DATA_DIR = fileURLToPath(new URL('./data/', import.meta.url));

/** "METHOD ruta" -> archivo JSON de respuesta. Agrega aquí cada endpoint nuevo. */
const ROUTES = {
  'GET /ui-batch-latam-backend/api/organizations': 'organizations.json',
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function send(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  });
  res.end(body === undefined ? '' : JSON.stringify(body));
}

createServer(async (req, res) => {
  const path = (req.url ?? '').split('?')[0];
  const key = `${req.method} ${path}`;
  const auth = req.headers.authorization ?? '';
  const started = Date.now();
  const log = (status) => console.log(`${new Date().toLocaleTimeString()}  ${key}  -> ${status} (${Date.now() - started} ms)`);

  if (req.method === 'OPTIONS') {
    send(res, 204);
    return;
  }

  await sleep(DELAY_MS);

  const file = ROUTES[key];
  if (!file) {
    send(res, 404, { message: `Ruta no simulada: ${key}` });
    log(404);
    return;
  }
  if (!/^Bearer\s+\S+/.test(auth)) {
    send(res, 401, { message: 'Falta el token (Authorization: Bearer ...)' });
    log(401);
    return;
  }

  try {
    const body = JSON.parse(await readFile(`${DATA_DIR}${file}`, 'utf8'));
    send(res, 200, body);
    log(200);
  } catch (error) {
    send(res, 500, { message: `No se pudo leer ${file}: ${error.message}` });
    log(500);
  }
}).listen(PORT, () => {
  console.log(`Mock de ui-batch-latam-backend en http://localhost:${PORT} (demora: ${DELAY_MS} ms)`);
  Object.keys(ROUTES).forEach((route) => console.log(`  ${route}`));
});
