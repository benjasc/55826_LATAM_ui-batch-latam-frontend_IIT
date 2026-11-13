export interface Environment {
  production: boolean;
  /** Dominio del backend usado en modo local. */
  apiBaseUrl: string;
  /** Token usado en modo local (token.json). */
  token: string;
  /** Solo para datos de prueba: el usuario demo tiene rol de administrador. */
  mockAdmin: boolean;
}
