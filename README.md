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
npm install
npm start                 # http://localhost:4200
ng test --watch=false     # pruebas unitarias
ng build                  # build de producción → dist/ui-batch-latam-frontend
```

## Estado
- **Pantallas terminadas con datos de prueba**: selección de organización y orquestación, Pizarra de Trabajo, Nuevo Procesamiento y Buscar Procesos.
- **Pendiente**:
  - handshake con Liferay;
  - integración HTTP con el backend y MFT;
  - interceptores y guard de roles;
  - Jest, ESLint, Docker, nginx y Jenkins.

Ver la §8 del documento de contexto.

**Datos de prueba**: en `src/environments/environment.development.ts`, `mockAdmin: true` hace que el usuario demo sea administrador. Ponlo en `false` para probar como usuario normal.
