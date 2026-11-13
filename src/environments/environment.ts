// Configuración de producción (ng build).
export const environment = {
  production: true,
  /** Dominio del backend. En producción lo entregará Liferay al iniciar la app. */
  apiBaseUrl: '',
  /** true = usa datos de prueba en vez de llamar al backend. */
  useMocks: false,
  /** Solo para datos de prueba: el usuario demo tiene rol de administrador. */
  mockAdmin: false,
};
