import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { API_PREFIX } from '@core/config/api-endpoints';
import { APP_CONFIG } from '@core/config/app-config';

/**
 * Agrega "Authorization: Bearer <token>" solo a las llamadas a nuestro backend,
 * para no enviar el token a servicios externos (por ejemplo MFT).
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const { token } = inject(APP_CONFIG);
  if (!token || !req.url.includes(API_PREFIX)) {
    return next(req);
  }
  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
