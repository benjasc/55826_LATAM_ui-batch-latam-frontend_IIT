import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable, defer, finalize, map, of, switchMap, throwError } from 'rxjs';

import { Organization } from '@core/models/organization.model';
import { ContextService } from '@core/services/context.service';
import { OrganizationService } from '@core/services/organization.service';
import { ContextSelectorDialog, ContextSelectorDialogData } from './context-selector-dialog';

/** El usuario no tiene organizaciones con orquestaciones para trabajar. */
export class NoOrganizationsError extends Error {
  constructor() {
    super('El usuario no tiene organizaciones con orquestaciones asociadas.');
  }
}

/** Solo se pueden elegir las organizaciones que tienen al menos una orquestación. */
export function selectableOrganizations(organizations: Organization[]): Organization[] {
  return organizations.filter((organization) => organization.orchestrations.length > 0);
}

/** Mensaje para el usuario según el error al obtener las organizaciones. */
export function organizationsErrorMessage(error: unknown): string {
  if (error instanceof NoOrganizationsError) {
    return 'Su usuario no tiene organizaciones con orquestaciones asociadas. Contacte al administrador.';
  }
  if (error instanceof HttpErrorResponse) {
    if (error.status === 401 || error.status === 403) {
      return 'No autorizado. Verifique que su sesión (token) sea válida.';
    }
    if (error.status === 0) {
      return 'No fue posible conectar con el servidor.';
    }
  }
  return 'No fue posible obtener sus organizaciones.';
}

@Injectable({ providedIn: 'root' })
export class ContextSelectorService {
  private readonly dialog = inject(MatDialog);
  private readonly organizationService = inject(OrganizationService);
  private readonly context = inject(ContextService);

  private readonly _loading = signal(false);
  /** true mientras se obtienen las organizaciones (antes de mostrar el modal). */
  readonly loading = this._loading.asReadonly();

  /**
   * Abre el modal de selección de organización/orquestación.
   * @param dismissible false al iniciar la app (obligatorio), true al reabrir desde el header.
   * @returns true si el usuario confirmó una selección. Falla si no se pudieron obtener organizaciones.
   */
  open(dismissible: boolean): Observable<boolean> {
    const organizations$ = defer(() => {
      this._loading.set(true);
      return this.organizationService.getOrganizations().pipe(finalize(() => this._loading.set(false)));
    });

    return organizations$.pipe(
      map(selectableOrganizations),
      switchMap((organizations) => {
        if (organizations.length === 0) {
          return throwError(() => new NoOrganizationsError());
        }

        // Una sola organización con una sola orquestación: se acepta sin mostrar el modal.
        const [onlyOrg] = organizations;
        if (!dismissible && organizations.length === 1 && onlyOrg.orchestrations.length === 1) {
          this.context.setContext(onlyOrg, onlyOrg.orchestrations[0]);
          return of(true);
        }

        const dialogRef = this.dialog.open<ContextSelectorDialog, ContextSelectorDialogData, boolean>(
          ContextSelectorDialog,
          {
            data: { organizations, dismissible },
            disableClose: !dismissible,
            width: '500px',
            autoFocus: false,
          },
        );
        return dialogRef.afterClosed().pipe(map((confirmed) => confirmed === true));
      }),
    );
  }
}
