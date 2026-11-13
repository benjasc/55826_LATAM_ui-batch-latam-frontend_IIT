import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { Organization } from '@core/models/organization.model';
import { OrganizationService } from './organization.service';

describe('OrganizationService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
  });

  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('obtiene las organizaciones con GET /ui-batch-latam-backend/api/organizations', () => {
    let result: Organization[] | undefined;
    TestBed.inject(OrganizationService).getOrganizations().subscribe((orgs) => (result = orgs));

    const req = TestBed.inject(HttpTestingController).expectOne('/ui-batch-latam-backend/api/organizations');
    expect(req.request.method).toBe('GET');
    req.flush([
      { name: 'CLSAFE', orchestrations: [] },
      { name: 'ECICBANCOGUAYAQUIL', orchestrations: [{ name: 'scorenuevaera' }, { name: 'bgnuevaerabto' }] },
      { name: 'SIN_LISTA', orchestrations: null },
    ]);

    expect(result).toEqual([
      { name: 'CLSAFE', orchestrations: [] },
      { name: 'ECICBANCOGUAYAQUIL', orchestrations: [{ name: 'scorenuevaera' }, { name: 'bgnuevaerabto' }] },
      { name: 'SIN_LISTA', orchestrations: [] },
    ]);
  });
});
