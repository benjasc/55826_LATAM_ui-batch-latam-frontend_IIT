import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { API } from '@core/config/api-endpoints';
import { Organization, OrganizationDto } from '@core/models/organization.model';

@Injectable({ providedIn: 'root' })
export class OrganizationService {
  private readonly http = inject(HttpClient);

  /** Organizaciones del usuario autenticado, con sus orquestaciones. */
  getOrganizations(): Observable<Organization[]> {
    return this.http.get<OrganizationDto[]>(API.organizations).pipe(
      map((organizations) =>
        (organizations ?? []).map((org) => ({
          name: org.name,
          orchestrations: (org.orchestrations ?? []).map((orch) => ({ name: orch.name })),
        })),
      ),
    );
  }
}
