import { Injectable, computed, signal } from '@angular/core';

import { Orchestration, Organization } from '@core/models/organization.model';

/**
 * Contexto activo de trabajo: organización + orquestación elegidas por el usuario.
 * Todas las pantallas lo leen para saber con qué configuración operar.
 */
@Injectable({ providedIn: 'root' })
export class ContextService {
  private readonly _organization = signal<Organization | null>(null);
  private readonly _orchestration = signal<Orchestration | null>(null);

  readonly organization = this._organization.asReadonly();
  readonly orchestration = this._orchestration.asReadonly();
  readonly hasContext = computed(() => !!this._organization() && !!this._orchestration());

  setContext(organization: Organization, orchestration: Orchestration): void {
    this._organization.set(organization);
    this._orchestration.set(orchestration);
  }
}
