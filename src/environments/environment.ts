// Configuración de producción (ng build).
import { Environment } from './environment.model';

export const environment: Environment = {
  production: true,
  /** En producción el dominio del backend lo entrega Liferay al iniciar la app. */
  apiBaseUrl: '',
  /** En producción el token lo entrega Liferay. */
  token: '',
  mockAdmin: false,
};
