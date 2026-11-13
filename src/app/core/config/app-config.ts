import { InjectionToken } from '@angular/core';

/** Configuración de ejecución, resuelta en main.ts antes de iniciar Angular. */
export interface AppConfig {
  /**
   * Dominio del backend que se antepone a las rutas del API.
   * Local: '' (proxy de ng serve). Liferay: el backendDomain que entrega el portal.
   */
  apiBaseUrl: string;
  /** Token Bearer para el backend. */
  token: string;
}

export const APP_CONFIG = new InjectionToken<AppConfig>('APP_CONFIG');
