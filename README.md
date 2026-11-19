# UI Batch LATAM (frontend)

Interfaz web de **Batch Management LATAM** (Equifax). Se abre dentro de Liferay y permite elegir organización y orquestación, cargar archivos CSV para procesamiento batch vía MFT, ver el estado de los procesos y buscarlos por fecha.

> 📄 **Contexto completo, decisiones y lo que queda por hacer:** [`docs/PROJECT-CONTEXT.md`](docs/PROJECT-CONTEXT.md)
> 🤖 **Convenciones para asistentes de IA:** [`.github/copilot-instructions.md`](.github/copilot-instructions.md)

## Stack
Angular 20 (standalone, signals) · Angular Material 20 (M3) · grid y utilidades de Bootstrap 5.3 · RxJS 7.8 · Karma/Jasmine

## Requisitos
- Node 20.19+ / 22.12+ / 24 (probado con 24.18)
- Angular CLI 20: `npm install -g @angular/cli@20` (opcional; también funciona `npx ng`)

## Uso
```bash
npm install               # crea token.json vacío si no existe
npm start                 # http://localhost:4200 (proxy /ui-batch-latam-backend → localhost:8080)
ng test --watch=false     # pruebas unitarias
ng build                  # build de producción → dist/ui-batch-latam-frontend
```

## Token y backend en local
1. Levanta el backend `ui-batch-latam-backend` en `http://localhost:8080`.
2. Pega tu token en **`token.json`** (raíz del proyecto), entre comillas: `"eyJhbGciOi..."`.
   - El archivo está en `.gitignore`. **Nunca lo subas.**
   - Si cambias el token con `npm start` corriendo, la app se recarga sola.
3. `npm start`.

## Backend simulado (sin el backend real)
`mock-api/` contiene un servidor Node sin dependencias. Escucha en el puerto 8080 como el backend real y responde con los JSON de `mock-api/data/`.

```bash
npm run mock:api          # terminal 1: mock en :8080 (2 s de demora para ver la carga)
npm start                 # terminal 2: la UI
```
- **Sin demora**: `$env:MOCK_DELAY_MS=0; npm run mock:api` (PowerShell).
- **Token**: igual que el backend real, responde 401 si no hay token. En `token.json` sirve cualquier texto, por ejemplo `"local"`.
- **Endpoints simulados**: `organizations`, `listall` y `batch-processes`.
  - Los procesos creados se guardan en memoria mientras el mock esté corriendo.
  - Los datos iniciales están en `mock-api/data/batch-processes.json`. Para ver datos, elige ECICBANCOBOLIVARIANO → modelobolivariano.
- **Endpoints nuevos**: se agregan en `ROUTES` de `mock-api/server.mjs`.

## Estado
- **Integrado con el backend**:
  - selección de organización y orquestación (`GET /api/organizations`);
  - Pizarra de Trabajo (`GET /api/listall`);
  - creación de procesos (`POST /api/batch-processes`).
- **Con datos de prueba**: Buscar Procesos y las descargas de Salida / Ver Obs.
- **Pendiente**:
  - handshake con Liferay;
  - integración HTTP del resto de las pantallas y MFT;
  - interceptores de errores y guard de roles;
  - Jest, ESLint, Docker, nginx y Jenkins.

Ver la §8 del documento de contexto.

**Datos de prueba**: en `src/environments/environment.development.ts`, `mockAdmin: true` hace que el usuario demo sea administrador. Ponlo en `false` para probar como usuario normal.
