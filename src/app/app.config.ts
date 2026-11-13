import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import {
  ApplicationConfig,
  LOCALE_ID,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { provideRouter, withComponentInputBinding } from '@angular/router';

import { provideSpanishDates } from '@core/i18n/spanish-date-adapter';
import { SpanishPaginatorIntl } from '@core/i18n/spanish-paginator-intl';
import { apiBaseUrlInterceptor } from '@core/http/api-base-url.interceptor';
import { authInterceptor } from '@core/http/auth.interceptor';

import { routes } from './app.routes';

// Formatos de número y fecha en español (1.234, nombres de meses, etc.).
registerLocaleData(localeEs);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    // withComponentInputBinding: los `data` de la ruta llegan como input() a los componentes.
    provideRouter(routes, withComponentInputBinding()),
    // El orden importa: primero se arma la URL completa y luego se agrega el token.
    provideHttpClient(withFetch(), withInterceptors([apiBaseUrlInterceptor, authInterceptor])),
    { provide: LOCALE_ID, useValue: 'es' },
    { provide: MatPaginatorIntl, useClass: SpanishPaginatorIntl },
    provideSpanishDates(),
  ],
};
