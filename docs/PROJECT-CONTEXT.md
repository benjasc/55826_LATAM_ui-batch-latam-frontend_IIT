# UI Batch LATAM: contexto completo del proyecto

> **Este documento describe la UI tal como existe y lo que falta para integrarla con el backend.**
> Para retomar el proyecto, léelo completo. Para las convenciones breves, ver `.github/copilot-instructions.md`.

---

## 1. Qué es y para qué sirve

**Batch** es un proceso de Equifax LATAM: un plugin Java sobre Apache Beam que ejecuta un pipeline definido en YAML. Ningún código de este repositorio forma parte de ese proceso.

**Flujo de negocio:**

1. El usuario deposita un archivo **CSV** en su casillero de **MFT** (Managed File Transfer).
2. MFT mueve el archivo a un **bucket GCS**. El archivo se detecta y comienza el proceso batch.
3. Para cada fila, el batch arma un JSON y consulta una API de enriquecimiento de datos del cliente.
4. El resultado vuelve a MFT como archivo de salida: un CSV procesado y un TXT de observaciones con los registros erróneos.

**Esta UI** permite hacer lo mismo que el depósito directo en MFT, pero de forma más amigable:

- Elegir **organización** y **orquestación (modelo)**. Un usuario puede tener varias organizaciones, y cada organización varias orquestaciones.
- Cargar el CSV. La UI lo deja en MFT y registra el proceso en la base de datos.
- Ver el estado de cada proceso y descargar la salida y las observaciones.
- Buscar procesos por rango de fechas.

**Acceso:**

- La app se abre **dentro de Liferay**, el portal de Equifax: el usuario inicia sesión y elige el portlet "Batch Management LATAM", que carga esta app en un iframe.
- El usuario debe estar asociado a una organización y tener el rol `LATAM_UI_BATCH_USER` o `LATAM_UI_BATCH_ADMIN`.

**Repositorios de referencia** (existen en GitHub de Equifax):

| Repo | Uso |
|---|---|
| `11919_LATAM_UI_BATCH-IC_FRONTEND_IIT` | UI **anterior y deprecada**, en Angular 14. De ahí salen la funcionalidad, los endpoints y el flujo MFT. Tiene muchas partes sin terminar (ver §8). |
| `10490_LATAM_ui-interconnect-frontend_IIT` | UI más actualizada de Equifax (Angular 20). Es la referencia de **infraestructura**: el handshake con Liferay, `env.js` en tiempo de ejecución, nginx, Docker, Jenkins y Jest. **No se copió su arquitectura** (NgModules) ni su librería propietaria `@signal/component-library` (componentes `efx-*`). |
| `EX UI.docx` | Especificación funcional de las pantallas. Este documento la resume. |

---

## 2. Estado actual (resumen)

| Área | Estado |
|---|---|
| Proyecto Angular 20 + Material 3 + grid de Bootstrap | ✅ Hecho |
| Tema Equifax (rojo `#981e32`) y estructura de carpetas | ✅ Hecho |
| Modal de selección Organización → Orquestación | ✅ Hecho, **conectado al API real** (`GET /api/organizations`) |
| Header con navegación y cambio de contexto | ✅ Hecho |
| Pizarra de Trabajo | ✅ Hecho, **conectada al API real** (`GET /api/listall`). Las descargas siguen simuladas. |
| Nuevo Procesamiento | ✅ Hecho, **conectado al API real** (`POST /api/batch-processes`). La subida del archivo a MFT es un paso posterior. |
| Buscar Procesos (con selector de usuario para administradores) | ✅ Hecho (datos de prueba) |
| Páginas de error 403, 500 y no encontrada | ✅ Hecho |
| Pruebas unitarias (Karma/Jasmine): 36 en verde | ✅ Hecho |
| Configuración de ejecución (`APP_CONFIG`), token local (`token.json`), proxy e interceptores de URL base y auth | ✅ Hecho |
| **Handshake con Liferay (token + dominio)** | ❌ Pendiente (stub en `load-app-config.ts`) |
| **Integración HTTP de Buscar Procesos y descargas (Salida / Ver Obs.)** | ❌ Pendiente (siguen con datos de prueba) |
| **Subida real a MFT y descargas reales** | ❌ Pendiente |
| Interceptores de errores globales y correlation id, guard de roles | ❌ Pendiente |
| Jest, ESLint, Dockerfile, nginx, `env.js` y Jenkins | ❌ Pendiente |

**Organizaciones, listado y creación de procesos vienen del backend.** Buscar Procesos y las descargas son de prueba (mocks en memoria). Cada punto que hay que reemplazar está marcado con `// TODO:` en el código.

---

## 3. Stack y decisiones técnicas

| Tema | Decisión |
|---|---|
| Framework | **Angular 20.3**, componentes standalone. Al crear el proyecto se eligió zone.js (no zoneless). |
| Node | 24.18 en local. El pipeline de Equifax usa contenedores node20 o node22; alinear con DevOps y agregar `engines` en `package.json`. |
| Componentes UI | **Angular Material 20 (M3)** + CDK. **No** usar la librería propietaria `efx-*`. |
| Layout | **Solo** el grid y las utilidades de Bootstrap 5.3, cargados como CSS en `angular.json` (`bootstrap-grid.min.css` + `bootstrap-utilities.min.css`). Sin reboot, sin componentes Bootstrap y sin su JS. |
| Estado | **Signals** en servicios (`signal`, `computed`, `asReadonly`). Sin NgRx. |
| Lectura de datos | `rxResource` (`params` + `stream`), que maneja la carga, los errores y la recarga. |
| Formularios | Reactive Forms **tipados**. |
| Plantillas | Control flow `@if` / `@for`, `ChangeDetectionStrategy.OnPush`. |
| Inyección | `inject()`, no constructores. |
| Inputs | `input()` / `input.required()`. Las rutas pasan `data` como inputs gracias a `withComponentInputBinding()`. |
| Idioma | Todo el texto visible está en **español**. `LOCALE_ID = 'es'`, paginador y calendario en español. |
| Tests | Karma + Jasmine (lo que trae Angular por defecto). Hay que migrar a Jest como en 10490 (pendiente). |

---

## 4. Estructura

```
src/
├── app/
│   ├── core/                         # Lo global y único en la app
│   │   ├── config/
│   │   │   ├── app-config.ts               # APP_CONFIG { apiBaseUrl, token } (InjectionToken)
│   │   │   ├── load-app-config.ts          # Resuelve APP_CONFIG antes del bootstrap (local / Liferay)
│   │   │   └── api-endpoints.ts            # API_PREFIX y rutas del backend (API.organizations, ...)
│   │   ├── http/
│   │   │   ├── api-base-url.interceptor.ts # Antepone apiBaseUrl a las rutas relativas
│   │   │   └── auth.interceptor.ts         # Authorization: Bearer (solo rutas de nuestro backend)
│   │   ├── i18n/
│   │   │   ├── spanish-date-adapter.ts     # Calendario dd/MM/yyyy + provideSpanishDates()
│   │   │   └── spanish-paginator-intl.ts   # "Registros por página", "1 – 15 de 23"
│   │   ├── models/
│   │   │   ├── organization.model.ts       # Organization, Orchestration
│   │   │   ├── batch-process.model.ts      # BatchProcess + BatchProcessDto + toBatchProcess(), ProcessStatus, reglas de descarga
│   │   │   └── user.model.ts               # User, CurrentUser, Role
│   │   └── services/
│   │       ├── context.service.ts          # Organización + orquestación activas (signals)
│   │       ├── organization.service.ts     # HTTP: GET /api/organizations
│   │       ├── batch-process.service.ts    # HTTP: listar (listall) y crear (batch-processes). MOCK: buscar y descargas
│   │       ├── user.service.ts             # MOCK: usuario actual, isAdmin, usuarios de la org
│   │       └── notification.service.ts     # Avisos (MatSnackBar) de éxito y error
│   ├── layout/header/                # Header: marca, navegación, contexto, botón 🏢
│   ├── shared/
│   │   ├── components/status-badge/  # Etiqueta de color por estado
│   │   └── utils/save-file.ts        # Descargar un Blob en el navegador
│   ├── features/                     # Una carpeta por pantalla
│   │   ├── context-selector/         # Modal Organización → Orquestación + servicio que lo abre
│   │   ├── workboard/                # Pizarra de Trabajo
│   │   ├── new-process/              # Nuevo Procesamiento + csv-file.validator.ts + count-csv-records.ts
│   │   ├── search/                   # Buscar Procesos + date-range.validator.ts
│   │   └── error/                    # 403 / 500 / no encontrada
│   ├── app.config.ts                 # Providers globales
│   ├── app.routes.ts                 # Rutas con loadComponent (carga diferida)
│   └── app.ts / app.html             # Shell: header + router-outlet; abre el modal al iniciar
├── environments/
│   ├── environment.model.ts          # Interfaz Environment
│   ├── environment.ts                # Producción (ng build): token vacío (lo entrega Liferay)
│   └── environment.development.ts    # Local (ng serve): importa ../../token.json, mockAdmin
├── styles/
│   ├── _palette.scss                 # Colores Equifax como variables SCSS y CSS (--brand-red, ...)
│   ├── _theme-colors.scss            # Paletas M3 generadas (ng g @angular/material:theme-color)
│   └── _theme.scss                   # mat.theme + overrides (rojo exacto, botones rectos, campos sin fondo)
└── styles.scss                       # Importa los parciales + estilos base globales
scripts/ensure-token.mjs              # Crea token.json vacío si no existe (postinstall / prestart)
proxy.config.json                     # /ui-batch-latam-backend/** → http://localhost:8080
mock-api/                             # Backend simulado (npm run mock:api): server.mjs + data/*.json
token.json                            # Token local (NO versionado, en .gitignore)
```

**Alias de imports** (`tsconfig.json`): `@core/*`, `@layout/*`, `@shared/*`, `@features/*`, `@env/*`. Hay que usarlos siempre en lugar de rutas relativas `../../`.

**Nombres de archivos:** se sigue el estilo de Angular 20, sin sufijo `.component`: `workboard-page.ts` define la clase `WorkboardPage`. Las pantallas se llaman `*-page` y los modales `*-dialog`.

---

## 5. Pantallas y comportamiento

### 5.1 Modal de contexto: Organización → Orquestación
`features/context-selector/`

- **Al iniciar** se abre de forma obligatoria (`disableClose`) y no se puede cerrar sin elegir.
- **Selectores**: Organización y luego Orquestación, que solo muestra las orquestaciones de la organización elegida.
  - Un selector solo se muestra si hay más de una opción. Si hay una sola, se autoselecciona.
  - Si hay **una sola organización con una sola orquestación**, el modal se acepta solo sin mostrarse.
  - **Las organizaciones sin orquestaciones no aparecen**: se filtran antes de abrir el modal con `selectableOrganizations()` en `context-selector.service.ts`. La selección automática se evalúa después del filtro.
- **Validación**: "Aceptar" se habilita solo con ambos campos completos. Los mensajes de error van en español.
- **Al aceptar**: se llama a `ContextService.setContext(org, orch)`, que todas las pantallas leen.
- **Reabrir**: el botón 🏢 del header reabre el modal con "Cancelar" y con la selección actual precargada.
- **Pantallas**: no se muestran hasta que existe un contexto (`@if (context.hasContext())` en `app.html`).

### 5.2 Pizarra de Trabajo (`/workboard`, ruta por defecto)
`features/workboard/`

- **Botones**: "Actualizar" recarga la lista y "Nuevo Procesamiento" navega a `/new-process`.
- **Tabla** dentro del panel "Lista de Archivos Procesados", con las columnas No., Nombre del Archivo, Cantidad de Registros, Fecha del Procesamiento (`createdAt`, `yyyy-MM-dd HH:mm:ss`), Estado, Salida y Ver Obs.
- **Datos**: `GET /api/listall` con los headers `organization` y `orchestration`. El backend devuelve solo los procesos del usuario del token.
- **Orden**: los más recientes primero. El No. más alto es el más reciente.
- **Cantidad de registros**: `null` se muestra como `--`.
- **Botones por fila** (reglas en `batch-process.model.ts`). **Mandan los flags del backend**:
  - **Salida** se habilita si `hasSuccess === true` (`canDownloadOutput`). El archivo es `successFilename`.
  - **Ver Obs.** se habilita si `hasErrors === true` (`canDownloadObservations`). El archivo es `errorFilename`.
  - La descarga en sí **sigue simulada**, porque aún no hay endpoint, pero ya usa el nombre real del archivo.
- **Paginación**: 15, 30 o 50 por página.
- **Estados especiales**: barra de carga mientras se consulta, mensaje de error con "Reintentar" y la fila "No hay procesos registrados." cuando no hay datos.
- **Recarga**: la lista se recarga sola al cambiar de organización u orquestación.

### 5.3 Nuevo Procesamiento (`/new-process`)
`features/new-process/`

- **Selección de archivo**: botón "Seleccionar archivo" sobre un `<input type=file accept=".csv">` oculto, con el nombre y el tamaño visibles. El basurero quita el archivo.
- **Validaciones** (`csv-file.validator.ts`):
  - la extensión debe ser `.csv` (se valida la extensión, no el MIME, porque Excel en Windows reporta otro tipo);
  - el nombre debe tener más de 3 letras sin contar la extensión;
  - el archivo no puede estar vacío (0 bytes);
  - el máximo es 400 MB.
- **Error**: si el archivo es inválido se muestra un mensaje en rojo y el archivo no queda seleccionado.
- **Cantidad de registros**: no hay campo para escribirla. **La UI la cuenta** al elegir el archivo (`count-csv-records.ts`):
  - **todas** las filas cuentan, porque el CSV no tiene encabezado;
  - se ignoran las líneas vacías;
  - el archivo se lee por stream, así que funciona hasta con 400 MB;
  - se muestra junto al nombre, por ejemplo "(27 bytes · 2 registros)";
  - un CSV sin filas con contenido se rechaza como vacío.
- **Botones**: "Regresar" vuelve a `/workboard`. "Finalizar" se habilita solo con un archivo válido.
- **Al finalizar**:
  1. Se llama a `POST /api/batch-processes` con `{ filename, recordsQuantity }` y los headers `organization`/`orchestration`. Mientras tanto se muestra "Creando proceso…" con todos los botones bloqueados.
  2. Si sale bien, aparece el aviso verde "El proceso se ha creado con éxito.", se navega a `/workboard` y el proceso queda primero con estado Validación (PENDIENTE).
  3. **Por ahora no se sube el contenido del archivo**: solo se registran el nombre y la cantidad. La subida a MFT vendrá en otro paso.
  4. Si falla, aparece un aviso rojo y el usuario se queda en la pantalla.

### 5.4 Buscar Procesos (`/search`)
`features/search/`

- **Fechas**: Inicio y Término con `mat-datepicker`. Se pueden escribir a mano con el formato `dd/mm/aaaa`.
- **Reglas de fechas**:
  - ambas son obligatorias;
  - no se aceptan fechas futuras;
  - Inicio no puede ser mayor que Término;
  - el rango máximo es **30 días** (`MAX_RANGE_DAYS` en `date-range.validator.ts`).
- **Selector Usuario**: solo lo ven los administradores (`Role.Admin`). Lista los usuarios de la organización activa y por defecto trae al propio administrador. Los demás usuarios buscan solo sus propios procesos.
- **Botones**: "Buscar" se habilita con el formulario válido. "Limpiar" borra las fechas y los resultados.
- **Resultados**: No., Nombre, Fecha (`dd-MM-yyyy`), Estado y Cantidad, en orden cronológico (No. 1 es el más antiguo) y con paginación de 15.
- **Mensajes**: "Seleccione un rango de fechas y presione Buscar." antes de buscar, y "No se encontraron procesos en el rango seleccionado." si no hay resultados.
- **Recarga**: la búsqueda se vuelve a ejecutar sola al cambiar de organización u orquestación.

### 5.5 Estados de proceso
Los estados vienen de la tabla `batch_status`. El enum es `ProcessStatus` en `batch-process.model.ts`.

| Código | BD | Se muestra al cliente como | Color |
|---|---|---|---|
| 001 | PENDIENTE | **Validación** (el cliente no ve PENDIENTE) | gris |
| 002 | VALIDACIÓN | Validación | gris |
| 003 | EJECUCIÓN | Ejecución | naranja |
| 004 | FINALIZADO | Finalizado | verde |
| 005 | CANCELADO | Cancelado | rojo |

---

## 6. Modelo de datos (backend: PostgreSQL, schema `uibatchlatam`)

```
batch_user (id, is_admin, last_access, user_name, user_id)
batch_organization (id, organization_name)
batch_orchestration (id, orchestration_name)
batch_user_detail (id, batch_user_id FK, batch_organization_id FK, batch_orchestration_id FK)   -- UNIQUE (user, org, orch)
batch_status (id, status_code, status_name)        -- 001..005
batch_process (id, created_at, file_name, file_process, process_date, records_quantity, uuid,
               batch_status_id FK, batch_user_detail_id FK)
batch_process_detail (id, instance_id, process_type, message, type, created_at, batch_process_id FK)
batch_output (id, output_name)
batch_output_result (output_id FK, process_id FK, records_quantity)   -- PK (output_id, process_id)
```

**El API no envía `id` de organización ni de orquestación**: el **nombre** es el identificador en todo el front (modal, `ContextService`, parámetros de los servicios).

**Relación con los modelos del front:**

| Front | Backend |
|---|---|
| `Organization` | `batch_organization` |
| `Orchestration` | `batch_orchestration` |
| `User` | `batch_user` |
| `BatchProcess` | `batch_process` + estado |

`batch_user_detail` es la que define qué orquestaciones de qué organización puede usar cada usuario. **Los modelos del front son una propuesta.** Al integrar, hay que ajustarlos a los DTO reales del backend o mapear en el servicio. Conviene mapear en el servicio para no tocar las pantallas.

---

## 7. Datos de prueba (mocks) y dónde reemplazarlos

| Servicio | Método | Qué simula | Reemplazar por |
|---|---|---|---|
| ~~`OrganizationService`~~ | ~~`getOrganizations()`~~ | ✅ **Ya usa el API real**: `GET /ui-batch-latam-backend/api/organizations` | — |
| `UserService` | `currentUser` (signal) | "Usuario Demo" (id 1), admin si `environment.mockAdmin` | Usuario y roles desde el backend o el token |
| `UserService` | `getOrganizationUsers(organization)` | 3 usuarios | GET de usuarios de la organización (solo para admin) |
| ~~`BatchProcessService`~~ | ~~`getProcesses(organization, orchestration)`~~ | ✅ **Ya usa el API real**: `GET /api/listall` | — |
| `BatchProcessService` | `searchProcesses(criteria)` | Genera procesos de prueba y filtra por usuario y rango de fechas | Endpoint de búsqueda (pendiente) |
| ~~`BatchProcessService`~~ | ~~`createProcess(organization, orchestration, fileName, recordsQuantity)`~~ | ✅ **Ya usa el API real**: `POST /api/batch-processes`. Falta la subida a MFT (otro paso). | — |
| `BatchProcessService` | `downloadOutput` / `downloadObservations` | Blob CSV/TXT de ejemplo | Descarga real (backend/MFT) |

- **Persistencia de los mocks**: guardan los datos en memoria (`mockStore`) y se pierden al recargar la página.
- **Fechas de prueba**: se generan respecto del día de hoy, para que la búsqueda de los últimos 30 días encuentre resultados.
- **Flag en `environment.development.ts`**: `mockAdmin: true` hace que el usuario demo sea administrador; poner `false` para probar como usuario normal.
- **Firmas de los métodos**: las pantallas solo dependen de ellas. Si se mantienen, la integración no requiere tocar los componentes.

---

## 8. Pendiente: integración con el backend (guía)

### 8.0 Ya implementado: configuración, token local y host dinámico
- **`main.ts`** llama a `loadAppConfig()` y recién después hace `bootstrapApplication`, entregando `APP_CONFIG = { apiBaseUrl, token }`.
- **Modo local** (`ng serve`, `production: false`):
  - el token se lee de **`token.json`** en la raíz del proyecto. Es solo el token entre comillas (`"eyJ..."`); si se pega con el prefijo `Bearer `, se quita;
  - `apiBaseUrl` es `''`, así que las llamadas van a `http://localhost:4200/ui-batch-latam-backend/...` y el **proxy** (`proxy.config.json`, configurado en `angular.json`) las reenvía a `http://localhost:8080`.
- **`token.json`**:
  - está en `.gitignore`;
  - lo crea vacío `scripts/ensure-token.mjs` (`postinstall` y `prestart`). Debe existir porque `tsconfig.app.json` compila todo `src/`, incluso en el build de producción.
- **Modo Liferay** (`production: true`): `loadFromLiferay()` es un **stub** que devuelve `{ apiBaseUrl: '', token: '' }`. Ahí va el handshake (§8.1). El `backendDomain` que entrega Liferay es el **host dinámico** por ambiente.
- **Interceptores funcionales** (en `app.config.ts`, en este orden):
  1. `apiBaseUrlInterceptor` antepone `apiBaseUrl` a las URLs que empiezan con `/`;
  2. `authInterceptor` agrega `Authorization: Bearer` **solo** a las URLs que contienen `/ui-batch-latam-backend/api`, para no enviar el token a MFT ni a otros servicios.
- **Rutas del API**: en `core/config/api-endpoints.ts`. Agregar ahí cada endpoint nuevo.
- **Carga inicial**: mientras se obtienen las organizaciones se muestra `LoadingCard` (`shared/components/loading-card`) sobre el mismo fondo del modal. La señal es `ContextSelectorService.loading`.
- **Backend simulado**: `npm run mock:api` levanta `mock-api/server.mjs` en :8080, con una demora configurable (`MOCK_DELAY_MS`, por defecto 2000) y 401 si falta el token. **Cada endpoint que se integre debe agregarse también al mock** (`ROUTES` + JSON en `mock-api/data/`).
- **Errores al obtener organizaciones** (`organizationsErrorMessage` en `context-selector.service.ts`). La app muestra el mensaje con un botón "Reintentar":
  - 401/403 → "No autorizado…";
  - status 0 → "No fue posible conectar con el servidor";
  - ninguna organización con orquestaciones (o lista vacía) → "Su usuario no tiene organizaciones con orquestaciones asociadas…".

### 8.1 Handshake con Liferay (se copia de 10490 / 11919, `src/main.ts`)
La app corre en un iframe de Liferay y **no tiene login propio**. Patrón de 10490:

1. En `main.ts`, **antes** de `bootstrapApplication`, escuchar `window.addEventListener('message', ...)`.
2. Avisar al portal con `window.parent.postMessage('AngularAppReady', '*')`. En 10490 se hace después de unos 4 s.
3. El mensaje trae datos de Liferay. En 10490: `{ snu, sessionId, serverName, serverPort, isSecure, otk, backendDomain, ... }`. En 11919 (más simple): `{ backendDomain, accessToken }`.
4. En 10490 se obtiene el token con `GET ${protocol}://${serverName}${port}/o/get_token?snu=..&sessionId=..&otk=..`, que devuelve `{ token: "<json con access_token>" }`.
5. Devolver `{ apiBaseUrl: backendDomain, token }` desde `loadFromLiferay()` en `core/config/load-app-config.ts`. `main.ts` ya lo entrega como `APP_CONFIG`.
6. ⚠️ El repo 11919 tiene un JWT real versionado en `token.json`; **no repetir eso**. Aquí `token.json` está en `.gitignore`.
7. Mejoras a considerar respecto de los repos anteriores:
   - **validar `event.origin`** del mensaje;
   - manejar el timeout (11919 espera 10 s) navegando a `/500`;
   - definir con el equipo qué pasa cuando el token expira. Ninguna de las UI anteriores lo refresca.

### 8.2 HTTP (pendiente)
- **Ya hechos**: URL base, auth y proxy (ver §8.0).
- **Interceptores que faltan** (agregarlos a `withInterceptors([...])`):
  - **correlation id**: header `Correlation-Id` con `crypto.randomUUID()`, como en 10490;
  - **error global**: 401/403 → `/403`; 5xx → `NotificationService.error(...)` o `/500` si es fatal.
- **Content-Type**: 10490 envía `application/vnd.com.equifax.latam.service.v1+json`; confirmar si el backend batch lo requiere.
- **Hosts**: no escribir hosts a mano en el código. 11919 lo hacía; no repetirlo.

### 8.3 Endpoints
**Backend nuevo** (`ui-batch-latam-backend`, puerto local 8080):

| Uso | Método + ruta | Estado |
|---|---|---|
| Organizaciones del usuario con sus orquestaciones | `GET /ui-batch-latam-backend/api/organizations` → `[{ name, orchestrations: [{ name }] }]` | ✅ Integrado (`OrganizationService`) |
| Procesos del usuario del token | `GET /ui-batch-latam-backend/api/listall` (headers `organization`, `orchestration`) → `[{ id, fileName, recordsQuantity, createdAt, statusCode, status, hasSuccess, successFilename, hasErrors, errorFilename, ... }]` | ✅ Integrado (`BatchProcessService.getProcesses`) |
| Crear proceso | `POST /ui-batch-latam-backend/api/batch-processes` (headers `organization`, `orchestration`), body `{ filename, recordsQuantity }` → `{ id, fileName, recordsQuantity, statusCode, status, organization, orchestration }` | ✅ Integrado (`BatchProcessService.createProcess`) |

**Headers de contexto**: los endpoints de procesos requieren `organization` y `orchestration`. Cada método de `BatchProcessService` los envía de forma explícita con `contextHeaders()`.

**Mapeo de la respuesta**: se hace con `toBatchProcess()` en `batch-process.model.ts`. El estado sale de `statusCode` (001–005); un código desconocido se muestra como "Desconocido".

**Endpoints de la UI anterior (11919)**: sirven solo como referencia del backend antiguo (`/ui-batch-ic-backend`). Confirmar los equivalentes con el equipo de backend.

| Uso | Método + ruta | Notas |
|---|---|---|
| Usuario, roles y organizaciones | `GET /api/information` | Devolvía `{ roles, organizations[{uuid, configurations[{orchestrations[]}]}], userId, name, ... }`. La nueva UI **no usa "configuración"**: solo Organización → Orquestación. |
| Listar procesos | `POST /data-service/process/list` | |
| Crear proceso | `POST /data-service/process/create` | Body: `{ fileName, recordsQuantity, processDate, status, createdAt, ... }` |
| Buscar procesos | `POST /data-service/process/search` | Body: `{ startDate:'DD/MM/YYYY', endDate:'DD/MM/YYYY', userId, ... }` |
| Usuarios de la organización (admin) | `POST /data-service/user/findByClient` | |
| Sesión MFT | `GET /data-service/mft/session` | Devuelve `{ cookies[], csrfToken }` |

**Flujo de subida a MFT en 11919** (como referencia de lo que hay que reemplazar en `createProcess`):

1. `GET /data-service/mft/session` → `{ cookies, csrfToken }`.
2. `POST https://mft.latam.equifax.com/api/v2.0/fileOperations` (header `csrfToken`) → `{ id }`.
3. `POST .../fileOperations/{id}` con `FormData` (campo `file`).
4. `POST /data-service/process/create`.

⚠️ 11919 escribía cookies de MFT con `document.cookie` desde el navegador y la carpeta destino estaba fija en `/prueba/`. **Se recomienda que el backend haga de intermediario con MFT**: el front sube el archivo al backend en un solo `POST multipart`. Hay que definirlo con el equipo de backend.

**Descargas** (Salida / Ver Obs.): en 11919 **nunca se implementaron**. Hay que definir el endpoint con backend; puede ser un GET que devuelva un Blob, que luego se pasa a `saveFile()`.

### 8.4 Roles y guard
- Al recibir el usuario: si no tiene organizaciones → `/500`; si no tiene rol batch → `/403`. Es el mismo comportamiento de 11919 y 10490.
- Crear un **guard funcional** (`CanActivateFn`) que exija `LATAM_UI_BATCH_USER` o `LATAM_UI_BATCH_ADMIN`.
- El token de Okta trae los roles con el prefijo `EFX_IC_ROLE_` (por ejemplo `EFX_IC_ROLE_LATAM_UI_BATCH_USER`). Confirmar si el backend lo quita.

### 8.5 Infraestructura (copiar de 10490)
- **Jest**: `jest-preset-angular` y quitar Karma. Mantener los alias en `moduleNameMapper`. Para Sonar: `coverage/lcov.info`.
- **ESLint**: flat config de angular-eslint 20, con las reglas estrictas de 10490.
- **Configuración en tiempo de ejecución**: `src/assets/env/env.template.js` + `generate-env.sh` (lee `/opt/config/application.properties` y ejecuta `envsubst`), y `index.html` carga `env.js`.
- **Docker y nginx**: imagen golden `nginx:alpine`, puerto 8080, `try_files ... /index.html`, sin caché. Exponer `manage/health.json` y `manage/version.json`.
- **Build**: `ng build --base-href /<ruta>/ --deploy-url /<ruta>/`. Definir la ruta, por ejemplo `/ui-batch-latam-frontend/`.
- **Jenkins**: `Jenkinsfile` y `scm/build_options.txt` con la shared library de Equifax.

---

## 9. Cómo correr

```bash
npm install                     # también crea token.json vacío si no existe
# Pega tu token en token.json (entre comillas) y levanta el backend en :8080,
# o usa el backend simulado: npm run mock:api (cualquier token sirve, ej. "local")
npm start                       # http://localhost:4200 (ng serve + proxy a :8080)
ng test --watch=false           # pruebas (Karma + Chrome)
ng build                        # build de producción → dist/ui-batch-latam-frontend
```

**Prueba manual rápida:**

1. Al abrir la app, elige una organización y una orquestación. Vienen del backend real; sin backend o sin token verás un error con "Reintentar".
2. En la Pizarra, prueba Salida y Ver Obs.
3. En Nuevo Procesamiento, sube un `.csv` y verás que aparece en la Pizarra.
4. En Buscar Procesos, elige un rango dentro de los últimos 30 días.
5. Con 🏢 cambia a otra orquestación; la cantidad de procesos de prueba varía según el nombre.

---

## 10. Decisiones tomadas con el usuario (no cambiar sin consultar)

1. Selección de **2 niveles**: Organización → Orquestación. El concepto "Configuración" de 11919 **no aplica**.
2. El comportamiento del modal es igual al de 11919: obligatorio al inicio, autoselección y reapertura desde el header.
   **Excepción**: las organizaciones sin orquestaciones **no se muestran** (pedido del equipo; antes se mostraban con un error, como en 11919).
3. **Sin campo "Cantidad de registros"** en Nuevo Procesamiento: **la UI cuenta las filas del CSV** (todas cuentan, porque no hay encabezado) y las envía como `recordsQuantity`.
4. Salida y Ver Obs. se habilitan según `hasSuccess` / `hasErrors` del backend.
5. PENDIENTE se muestra como "Validación". El cliente ve 4 estados.
6. Buscar Procesos mantiene el **selector de usuario para administradores**.
7. Rango máximo de búsqueda: **30 días**, según `EX UI.docx`. 11919 usaba 365.
8. Paleta Equifax: rojo `#981e32`, gris `#4d545a`, naranja `#ffa900`, gris de botón `#9d9d9d`. Fuente Open Sans.
9. Material + grid de Bootstrap. **No** usar la librería propietaria `efx-*` de 10490.
10. Los estados llevan etiquetas de color. La UI anterior los mostraba como texto plano.
