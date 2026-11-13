import { Injectable } from '@angular/core';
import { Observable, delay, of } from 'rxjs';

import { Organization } from '@core/models/organization.model';

/** Datos de prueba mientras no exista la API del backend. */
const MOCK_ORGANIZATIONS: Organization[] = [
  {
    id: 1,
    name: 'ARICBOOKSTORE',
    orchestrations: [
      { id: 1, name: 'testmodel' },
      { id: 2, name: 'modelo-riesgo' },
    ],
  },
  {
    id: 2,
    name: 'EQUIFAX CHILE',
    orchestrations: [{ id: 3, name: 'modelo-chile' }],
  },
  {
    id: 3,
    name: 'ORGANIZACION SIN MODELOS',
    orchestrations: [],
  },
];

@Injectable({ providedIn: 'root' })
export class OrganizationService {
  /**
   * Organizaciones (con sus orquestaciones) del usuario.
   * TODO: reemplazar por la llamada HTTP al backend.
   */
  getOrganizations(): Observable<Organization[]> {
    return of(MOCK_ORGANIZATIONS).pipe(delay(300));
  }
}
