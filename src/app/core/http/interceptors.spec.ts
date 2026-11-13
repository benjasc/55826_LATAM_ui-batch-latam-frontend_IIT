import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { APP_CONFIG, AppConfig } from '@core/config/app-config';
import { apiBaseUrlInterceptor } from './api-base-url.interceptor';
import { authInterceptor } from './auth.interceptor';

describe('Interceptores HTTP', () => {
  function setup(config: AppConfig) {
    TestBed.configureTestingModule({
      providers: [
        { provide: APP_CONFIG, useValue: config },
        provideHttpClient(withInterceptors([apiBaseUrlInterceptor, authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    return { http: TestBed.inject(HttpClient), httpMock: TestBed.inject(HttpTestingController) };
  }

  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('antepone el dominio y agrega el token a las rutas del backend', () => {
    const { http, httpMock } = setup({ apiBaseUrl: 'https://dev.equifax.cl/', token: 'abc' });
    http.get('/ui-batch-latam-backend/api/organizations').subscribe();

    const req = httpMock.expectOne('https://dev.equifax.cl/ui-batch-latam-backend/api/organizations');
    expect(req.request.headers.get('Authorization')).toBe('Bearer abc');
    req.flush([]);
  });

  it('en local (sin dominio) deja la ruta relativa para el proxy', () => {
    const { http, httpMock } = setup({ apiBaseUrl: '', token: 'abc' });
    http.get('/ui-batch-latam-backend/api/organizations').subscribe();
    httpMock.expectOne('/ui-batch-latam-backend/api/organizations').flush([]);
  });

  it('no envía el token a servicios externos', () => {
    const { http, httpMock } = setup({ apiBaseUrl: 'https://dev.equifax.cl', token: 'abc' });
    http.get('https://mft.latam.equifax.com/api/v2.0/files').subscribe();

    const req = httpMock.expectOne('https://mft.latam.equifax.com/api/v2.0/files');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush([]);
  });

  it('sin token no agrega el header', () => {
    const { http, httpMock } = setup({ apiBaseUrl: '', token: '' });
    http.get('/ui-batch-latam-backend/api/organizations').subscribe();

    const req = httpMock.expectOne('/ui-batch-latam-backend/api/organizations');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush([]);
  });
});
