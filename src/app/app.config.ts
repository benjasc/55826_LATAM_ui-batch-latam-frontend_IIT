import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import {
  ApplicationConfig,
  LOCALE_ID,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { provideRouter, withComponentInputBinding } from '@angular/router';

import { provideSpanishDates } from '@core/i18n/spanish-date-adapter';
import { SpanishPaginatorIntl } from '@core/i18n/spanish-paginator-intl';

import { routes } from './app.routes';

// Formatos de número y fecha en español (1.234, nombres de meses, etc.).
registerLocaleData(localeEs);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    // withComponentInputBinding: los `data` de la ruta llegan como input() a los componentes.
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withFetch()),
    { provide: LOCALE_ID, useValue: 'es' },
    { provide: MatPaginatorIntl, useClass: SpanishPaginatorIntl },
    provideSpanishDates(),
  ],
};
