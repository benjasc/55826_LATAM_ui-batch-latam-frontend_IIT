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
| Modal de selección Organización → Orquestación | ✅ Hecho (datos de prueba) |
| Header con navegación y cambio de contexto | ✅ Hecho |
| Pizarra de Trabajo | ✅ Hecho (datos de prueba) |
| Nuevo Procesamiento (carga de CSV) | ✅ Hecho (subida simulada) |
| Buscar Procesos (con selector de usuario para administradores) | ✅ Hecho (datos de prueba) |
| Páginas de error 403, 500 y no encontrada | ✅ Hecho |
| Pruebas unitarias (Karma/Jasmine): 36 en verde | ✅ Hecho |
| **Handshake con Liferay (token + dominio)** | ❌ Pendiente |
| **Integración HTTP con el backend (reemplazar los datos de prueba)** | ❌ Pendiente |
| **Subida real a MFT y descargas reales** | ❌ Pendiente |
| Interceptores (auth, errores, correlation id) y guard de roles | ❌ Pendiente |
| Jest, ESLint, Dockerfile, nginx, `env.js` y Jenkins | ❌ Pendiente |

**Todos los datos son de prueba** (mocks en memoria). Cada punto que hay que reemplazar está marcado con `// TODO:` en el código.

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
│   │   ├── i18n/
│   │   │   ├── spanish-date-adapter.ts     # Calendario dd/MM/yyyy + provideSpanishDates()
│   │   │   └── spanish-paginator-intl.ts   # "Registros por página", "1 – 15 de 23"
│   │   ├── models/
│   │   │   ├── organization.model.ts       # Organization, Orchestration
│   │   │   ├── batch-process.model.ts      # BatchProcess, ProcessStatus, reglas de descarga, ProcessSearchCriteria
│   │   │   └── user.model.ts               # User, CurrentUser, Role
│   │   └── services/
│   │       ├── context.service.ts          # Organización + orquestación activas (signals)
│   │       ├── organization.service.ts     # MOCK: organizaciones del usuario
│   │       ├── batch-process.service.ts    # MOCK: listar, buscar, crear proceso, descargas
│   │       ├── user.service.ts             # MOCK: usuario actual, isAdmin, usuarios de la org
│   │       └── notification.service.ts     # Avisos (MatSnackBar) de éxito y error
│   ├── layout/header/                # Header: marca, navegación, contexto, botón 🏢
│   ├── shared/
│   │   ├── components/status-badge/  # Etiqueta de color por estado
│   │   └── utils/save-file.ts        # Descargar un Blob en el navegador
│   ├── features/                     # Una carpeta por pantalla
│   │   ├── context-selector/         # Modal Organización → Orquestación + servicio que lo abre
│   │   ├── workboard/                # Pizarra de Trabajo
│   │   ├── new-process/              # Nuevo Procesamiento + csv-file.validator.ts
│   │   ├── search/                   # Buscar Procesos + date-range.validator.ts
│   │   └── error/                    # 403 / 500 / no encontrada
│   ├── app.config.ts                 # Providers globales
│   ├── app.routes.ts                 # Rutas con loadComponent (carga diferida)
│   └── app.ts / app.html             # Shell: header + router-outlet; abre el modal al iniciar
├── environments/
│   ├── environment.ts                # Producción (ng build)
│   └── environment.development.ts    # Local (ng serve), con useMocks y mockAdmin
├── styles/
│   ├── _palette.scss                 # Colores Equifax como variables SCSS y CSS (--brand-red, ...)
│   ├── _theme-colors.scss            # Paletas M3 generadas (ng g @angular/material:theme-color)
│   └── _theme.scss                   # mat.theme + overrides (rojo exacto, botones rectos, campos sin fondo)
└── styles.scss                       # Importa los parciales + estilos base globales
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
  - Si la organización no tiene orquestaciones, se muestra el error "Esta organización no tiene orquestaciones asociadas."
- **Validación**: "Aceptar" se habilita solo con ambos campos completos. Los mensajes de error van en español.
- **Al aceptar**: se llama a `ContextService.setContext(org, orch)`, que todas las pantallas leen.
- **Reabrir**: el botón 🏢 del header reabre el modal con "Cancelar" y con la selección actual precargada.
- **Pantallas**: no se muestran hasta que existe un contexto (`@if (context.hasContext())` en `app.html`).

### 5.2 Pizarra de Trabajo (`/workboard`, ruta por defecto)
`features/workboard/`

- **Botones**: "Actualizar" recarga la lista y "Nuevo Procesamiento" navega a `/new-process`.
- **Tabla** dentro del panel "Lista de Archivos Procesados", con las columnas No., Nombre del Archivo, Cantidad de Registros, Fecha del Procesamiento (`yyyy-MM-dd HH:mm:ss`), Estado, Salida y Ver Obs.
- **Contenido**: solo los procesos **del usuario actual** en la organización y orquestación activas, los más recientes primero. El No. más alto es el más reciente.
- **Cantidad de registros**: `null` se muestra como `--`. El usuario ya no la ingresa; la completa el backend.
- **Botones por fila** (reglas en `batch-process.model.ts`):
  - **Salida** se habilita solo si el estado es FINALIZADO (`canDownloadOutput`) y descarga el CSV procesado.
  - **Ver Obs.** se habilita si el proceso está FINALIZADO o CANCELADO **y** `observationsQuantity > 0` (`canDownloadObservations`). Descarga un TXT con los registros erróneos.
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
- **Cantidad de registros**: **no existe este campo**. El usuario decidió quitarlo; la cantidad la informa el backend.
- **Botones**: "Regresar" vuelve a `/workboard`. "Finalizar" se habilita solo con un archivo válido.
- **Al finalizar**:
  1. Se muestra "Cargando archivo…" con todos los botones bloqueados.
  2. Si sale bien, aparece el aviso verde "El archivo se ha cargado con éxito.", se navega a `/workboard` y el proceso queda primero con estado Validación.
  3. Si falla, aparece un aviso rojo y el usuario se queda en la pantalla.

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
| `OrganizationService` | `getOrganizations()` | 3 organizaciones: ARICBOOKSTORE (2 orquestaciones), EQUIFAX CHILE (1) y una sin orquestaciones | GET de organizaciones y orquestaciones del usuario |
| `UserService` | `currentUser` (signal) | "Usuario Demo" (id 1), admin si `environment.mockAdmin` | Usuario y roles desde el backend o el token |
| `UserService` | `getOrganizationUsers(orgId)` | 3 usuarios | GET de usuarios de la organización (solo para admin) |
| `BatchProcessService` | `getProcesses(org, orch, userId)` | Lista por orquestación (testmodel: 12, modelo-riesgo: 40, modelo-chile: 0) | GET de procesos del usuario |
| `BatchProcessService` | `searchProcesses(criteria)` | Filtra por usuario y rango de fechas | POST/GET de búsqueda |
| `BatchProcessService` | `createProcess(org, orch, userId, file)` | Guarda en memoria con estado PENDIENTE | Subida a MFT + registro del proceso |
| `BatchProcessService` | `downloadOutput` / `downloadObservations` | Blob CSV/TXT de ejemplo | Descarga real (backend/MFT) |

- **Persistencia de los mocks**: guardan los datos en memoria (`mockStore`) y se pierden al recargar la página.
- **Fechas de prueba**: se generan respecto del día de hoy, para que la búsqueda de los últimos 30 días encuentre resultados.
- **Flags en `environment.development.ts`**:
  - `useMocks: true`. Todavía no se lee en ninguna parte; la idea es usarlo para alternar entre datos de prueba y HTTP durante la integración.
  - `mockAdmin: true`. El usuario demo es administrador; poner `false` para probar como usuario normal.
- **Firmas de los métodos**: las pantallas solo dependen de ellas. Si se mantienen, la integración no requiere tocar los componentes.

---

## 8. Pendiente: integración con el backend (guía)

### 8.1 Handshake con Liferay (se copia de 10490 / 11919, `src/main.ts`)
La app corre en un iframe de Liferay y **no tiene login propio**. Patrón de 10490:

1. En `main.ts`, **antes** de `bootstrapApplication`, escuchar `window.addEventListener('message', ...)`.
2. Avisar al portal con `window.parent.postMessage('AngularAppReady', '*')`. En 10490 se hace después de unos 4 s.
3. El mensaje trae datos de Liferay. En 10490: `{ snu, sessionId, serverName, serverPort, isSecure, otk, backendDomain, ... }`. En 11919 (más simple): `{ backendDomain, accessToken }`.
4. En 10490 se obtiene el token con `GET ${protocol}://${serverName}${port}/o/get_token?snu=..&sessionId=..&otk=..`, que devuelve `{ token: "<json con access_token>" }`.
5. `bootstrapApplication(App, { providers: [...appConfig.providers, { provide: APP_CONFIG, useValue: { domain, token } }] })`.
6. Para desarrollo local, usar `environment.apiBaseUrl` y un token de un archivo **no versionado**. ⚠️ El repo 11919 tiene un JWT real versionado en `token.json`; **no repetir eso**.
7. Mejoras a considerar respecto de los repos anteriores:
   - **validar `event.origin`** del mensaje;
   - manejar el timeout (11919 espera 10 s) navegando a `/500`;
   - definir con el equipo qué pasa cuando el token expira. Ninguna de las UI anteriores lo refresca.

### 8.2 HTTP
- `provideHttpClient(withFetch())` ya está en `app.config.ts`. Agregar `withInterceptors([...])` con **interceptores funcionales** (`HttpInterceptorFn`):
  - **auth**: `Authorization: Bearer <token>`. 10490 además envía `Content-Type: application/vnd.com.equifax.latam.service.v1+json`; confirmar cuál espera el backend batch.
  - **correlation id**: header `Correlation-Id` con `crypto.randomUUID()`, como en 10490.
  - **error global**: 401/403 → `/403`; 5xx → `NotificationService.error(...)` o `/500` si es fatal.
- **URL base**: tomarla de `APP_CONFIG.domain`, no de URLs escritas a mano. 11919 tenía hosts de desarrollo fijos en el código; no repetirlo.
- **Proxy local**: crear `proxy.config.json` (`/ui-batch-ic-backend/**` → backend local) y cambiar el script a `"start": "ng serve --proxy-config proxy.config.json"`.

### 8.3 Endpoints conocidos de la UI anterior (11919)
Sirven como referencia. **Hay que confirmar con el backend actual** si siguen vigentes; el prefijo era `{domain}/ui-batch-ic-backend`.

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
npm install
npm start                       # http://localhost:4200 (ng serve)
ng test --watch=false           # pruebas (Karma + Chrome)
ng build                        # build de producción → dist/ui-batch-latam-frontend
```

**Prueba manual rápida:**

1. Al abrir la app, elige ARICBOOKSTORE → testmodel.
2. En la Pizarra, prueba Salida y Ver Obs.
3. En Nuevo Procesamiento, sube un `.csv` y verás que aparece en la Pizarra.
4. En Buscar Procesos, elige un rango dentro de los últimos 30 días.
5. Con 🏢 cambia a modelo-riesgo (muchos procesos y paginación) o a EQUIFAX CHILE (sin procesos).

---

## 10. Decisiones tomadas con el usuario (no cambiar sin consultar)

1. Selección de **2 niveles**: Organización → Orquestación. El concepto "Configuración" de 11919 **no aplica**.
2. El comportamiento del modal es igual al de 11919: obligatorio al inicio, autoselección y reapertura desde el header.
3. **Sin campo "Cantidad de registros"** en Nuevo Procesamiento, y sin comparar con el número de líneas del archivo.
4. Salida solo en FINALIZADO. Ver Obs. en FINALIZADO o CANCELADO, y solo si hubo errores.
5. PENDIENTE se muestra como "Validación". El cliente ve 4 estados.
6. Buscar Procesos mantiene el **selector de usuario para administradores**.
7. Rango máximo de búsqueda: **30 días**, según `EX UI.docx`. 11919 usaba 365.
8. Paleta Equifax: rojo `#981e32`, gris `#4d545a`, naranja `#ffa900`, gris de botón `#9d9d9d`. Fuente Open Sans.
9. Material + grid de Bootstrap. **No** usar la librería propietaria `efx-*` de 10490.
10. Los estados llevan etiquetas de color. La UI anterior los mostraba como texto plano.
