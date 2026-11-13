import { environment } from '@env/environment';

import { AppConfig } from './app-config';

/** Quita el prefijo "Bearer " por si se pegó el header completo en token.json. */
export function normalizeToken(token: string): string {
  return token.trim().replace(/^Bearer\s+/i, '');
}

/**
 * Obtiene dominio del backend y token antes de iniciar Angular.
 * - Modo local (ng serve con token en token.json): usa environment.
 * - Modo portal (Liferay): el portal entrega backendDomain + token (pendiente, ver docs §8.1).
 */
export async function loadAppConfig(): Promise<AppConfig> {
  const localToken = normalizeToken(environment.token);

  if (!environment.production) {
    if (!localToken) {
      console.warn('[config] token.json está vacío: las llamadas al backend responderán 401.');
    }
    console.info('[config] Modo local.');
    return { apiBaseUrl: environment.apiBaseUrl, token: localToken };
  }

  return loadFromLiferay();
}

/**
 * TODO: handshake con Liferay (ver docs/PROJECT-CONTEXT.md §8.1 y src/main.ts de 10490):
 * escuchar window 'message', enviar 'AngularAppReady' al padre, obtener el token con /o/get_token
 * y devolver { apiBaseUrl: backendDomain, token }.
 */
async function loadFromLiferay(): Promise<AppConfig> {
  console.warn('[config] Modo Liferay aún no implementado.');
  return { apiBaseUrl: '', token: '' };
}
