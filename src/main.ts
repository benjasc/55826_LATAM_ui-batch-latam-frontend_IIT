import { bootstrapApplication } from '@angular/platform-browser';

import { App } from './app/app';
import { appConfig } from './app/app.config';
import { APP_CONFIG } from './app/core/config/app-config';
import { loadAppConfig } from './app/core/config/load-app-config';

// Primero se obtiene el dominio del backend y el token (local o Liferay); luego se inicia Angular.
loadAppConfig()
  .then((config) =>
    bootstrapApplication(App, {
      ...appConfig,
      providers: [...appConfig.providers, { provide: APP_CONFIG, useValue: config }],
    }),
  )
  .catch((err) => console.error(err));
