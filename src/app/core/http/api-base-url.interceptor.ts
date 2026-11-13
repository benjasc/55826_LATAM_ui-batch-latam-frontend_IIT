import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { APP_CONFIG } from '@core/config/app-config';

/** Antepone el dominio del backend (APP_CONFIG.apiBaseUrl) a las rutas relativas que empiezan con "/". */
export const apiBaseUrlInterceptor: HttpInterceptorFn = (req, next) => {
  const { apiBaseUrl } = inject(APP_CONFIG);
  if (!req.url.startsWith('/') || !apiBaseUrl) {
    return next(req);
  }
  return next(req.clone({ url: `${apiBaseUrl.replace(/\/+$/, '')}${req.url}` }));
};
