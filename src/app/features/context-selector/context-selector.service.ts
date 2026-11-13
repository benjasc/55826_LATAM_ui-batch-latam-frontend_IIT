import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable, map, of, switchMap } from 'rxjs';

import { ContextService } from '@core/services/context.service';
import { OrganizationService } from '@core/services/organization.service';
import { ContextSelectorDialog, ContextSelectorDialogData } from './context-selector-dialog';

@Injectable({ providedIn: 'root' })
export class ContextSelectorService {
  private readonly dialog = inject(MatDialog);
  private readonly organizationService = inject(OrganizationService);
  private readonly context = inject(ContextService);

  /**
   * Abre el modal de selección de organización/orquestación.
   * @param dismissible false al iniciar la app (obligatorio), true al reabrir desde el header.
   * @returns true si el usuario confirmó una selección.
   */
  open(dismissible: boolean): Observable<boolean> {
    return this.organizationService.getOrganizations().pipe(
      switchMap((organizations) => {
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
