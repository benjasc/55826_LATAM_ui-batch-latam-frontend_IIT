# Instrucciones para el asistente (Copilot / Claude)

Este repo contiene **UI Batch LATAM** (Equifax), una SPA en Angular 20 que corre dentro de un iframe de Liferay. Permite:
- elegir organización y orquestación;
- cargar archivos CSV que van a MFT y se procesan en batch;
- ver el estado de los procesos y buscarlos.

**Antes de cualquier tarea, lee `docs/PROJECT-CONTEXT.md`.** Ahí está el negocio, lo construido, las decisiones tomadas y la guía para integrar el backend (lo siguiente por hacer).

## Idioma
- Responde y escribe la documentación en **español**.
- Todo el texto visible de la UI va en español. Los identificadores de código van en inglés.

## Stack obligatorio
- **Angular 20**, solo componentes **standalone**. No crear NgModules.
- **Angular Material 20 (M3)** + CDK para los componentes.
  - **Prohibido** usar `@signal/component-library` (`efx-*`) u otra librería propietaria.
  - **Prohibido** usar componentes o JS de Bootstrap.
- Bootstrap 5.3 **solo** para el grid y las utilidades (`row`, `col-md-4`, `d-flex`, `mb-3`…). Ya se carga como CSS en `angular.json`.
- Estado con **signals** (`signal`, `computed`, `asReadonly`) en servicios `providedIn: 'root'`. Sin NgRx y sin `BehaviorSubject` para estado.
- Lectura de datos con `rxResource({ params, stream })`. RxJS solo para HTTP y flujos.

## Convenciones de código
- `inject()` en lugar de inyección por constructor.
- `input()` / `input.required()` / `output()` en lugar de decoradores. Usar `viewChild()`.
- `changeDetection: ChangeDetectionStrategy.OnPush` en todos los componentes.
- Plantillas con `@if` / `@for` (con `track`) / `@switch`. **No** usar `*ngIf` ni `*ngFor`.
- Reactive Forms **tipados** (`FormControl<T>`, `nonNullable` cuando aplique). No usar `Untyped*`.
- Interceptores y guards **funcionales** (`HttpInterceptorFn`, `CanActivateFn`).
- Imports con alias: `@core/*`, `@layout/*`, `@shared/*`, `@features/*`, `@env/*`. No usar `../../`.
- Nombres de archivo estilo Angular 20, sin sufijo: `workboard-page.ts` → `WorkboardPage`, `context-selector-dialog.ts` → `ContextSelectorDialog`.
- **Ubicación del código**:
  - una carpeta por pantalla en `features/`;
  - lo global en `core/` (models, services, i18n);
  - lo reutilizable en `shared/`;
  - el marco de la app en `layout/`.
- **Lógica fuera de los componentes**: reglas de negocio y validadores en funciones puras, como `canDownloadOutput`, `validateCsvFile` y `dateRangeValidator`.

## Estilos
- **Colores**: usar las variables CSS de `src/styles/_palette.scss` (`var(--brand-red)`, `--brand-gray`, `--border-color`…). No escribir los hex sueltos.
- **Tema**: el tema Material está en `src/styles/_theme.scss`. Los botones principales son `mat-flat-button`, que ya sale en rojo Equifax.
- **Clases globales** (en `styles.scss`):
  - `btn-neutral`: botones grises como Limpiar o Cancelar;
  - `page-title`: título de página con línea inferior.
- No usar `::ng-deep`.

## Datos de prueba e integración
- Los servicios de `core/services/` usan **datos de prueba en memoria**, marcados con `// TODO:`.
- **Al integrar el backend**:
  - mantener las **firmas públicas** de los servicios, para que las pantallas no cambien;
  - mapear los DTO del backend a los modelos de `core/models/` dentro del servicio.
- **Endpoints nuevos**: agregarlos en `core/config/api-endpoints.ts` (`API.*`) y llamarlos con rutas **relativas**:
  - `apiBaseUrlInterceptor` antepone el dominio;
  - `authInterceptor` agrega el token.
- **Mock**: cada endpoint integrado se agrega también al backend simulado (`mock-api/server.mjs` → `ROUTES` + datos en `mock-api/data/`).
- **Headers de contexto**: los endpoints de procesos requieren `organization` y `orchestration`. Se envían con `contextHeaders()` en el servicio.
- **DTO**: cada respuesta del backend tiene su `*Dto` y una función `to*()` que la convierte al modelo del front. Las pantallas nunca usan DTOs.
- No escribir hosts de backend a mano.
- **Identificadores**: el API usa el **nombre** de la organización y la orquestación (no hay `id`).
- **Token local**: `token.json` en la raíz, en `.gitignore`. No versionar tokens ni credenciales.

## Pruebas
- Cada pantalla, validador y regla de negocio tiene su `*.spec.ts`. Al cambiar comportamiento, actualizar o agregar pruebas.
- Ejecutar: `ng test --watch=false`. Todas deben quedar en verde, y `ng build` sin errores ni advertencias.
- **Componentes con datepicker**: incluir `provideSpanishDates()` en los providers de la prueba.

## Decisiones que no se cambian sin consultar
Ver la §10 de `docs/PROJECT-CONTEXT.md`. Por ejemplo:
- la selección tiene 2 niveles, sin "Configuración";
- no hay campo de cantidad de registros;
- el rango de búsqueda es de 30 días;
- el selector de usuario es solo para administradores.
