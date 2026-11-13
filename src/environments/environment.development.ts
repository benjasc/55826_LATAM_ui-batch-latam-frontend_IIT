// Configuración local (ng serve / npm start).
import token from '../../token.json';

import { Environment } from './environment.model';

export const environment: Environment = {
  production: false,
  /**
   * Vacío = misma URL de ng serve (http://localhost:4200). proxy.config.json reenvía
   * /ui-batch-latam-backend/** al backend local (http://localhost:8080).
   */
  apiBaseUrl: '',
  /** Token de prueba leído de token.json (raíz del proyecto, ignorado por git). */
  token,
  /** Solo para datos de prueba: true = el usuario demo es LATAM_UI_BATCH_ADMIN. */
  mockAdmin: true,
};
