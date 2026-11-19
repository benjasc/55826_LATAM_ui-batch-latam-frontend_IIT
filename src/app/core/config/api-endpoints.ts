/** Prefijo de todas las rutas del backend ui-batch-latam-backend. */
export const API_PREFIX = '/ui-batch-latam-backend/api';

/** Rutas del backend (relativas; el interceptor antepone el dominio de APP_CONFIG). */
export const API = {
  /** GET: organizaciones del usuario con sus orquestaciones. */
  organizations: `${API_PREFIX}/organizations`,
  /** GET: procesos batch del usuario (headers organization/orchestration). */
  listAll: `${API_PREFIX}/listall`,
  /** POST: crea un proceso batch { filename, recordsQuantity } (headers organization/orchestration). */
  batchProcesses: `${API_PREFIX}/batch-processes`,
} as const;
