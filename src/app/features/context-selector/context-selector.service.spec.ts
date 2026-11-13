import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';

import { Organization } from '@core/models/organization.model';
import { ContextService } from '@core/services/context.service';
import { OrganizationService } from '@core/services/organization.service';
import { ContextSelectorDialogData } from './context-selector-dialog';
import { ContextSelectorService, NoOrganizationsError, selectableOrganizations } from './context-selector.service';

const EMPTY_A: Organization = { name: 'CLSAFE', orchestrations: [] };
const EMPTY_B: Organization = { name: 'CLCMS', orchestrations: [] };
const SINGLE: Organization = { name: 'ECICBANCOGUAYAQUIL', orchestrations: [{ name: 'scorenuevaera' }] };
const MULTI: Organization = {
  name: 'ARICNBSANTAFE',
  orchestrations: [{ name: 'icnbsantafehaberes' }, { name: 'icnbsantafesinhaberes' }],
};

describe('selectableOrganizations', () => {
  it('excluye las organizaciones sin orquestaciones y mantiene el orden', () => {
    expect(selectableOrganizations([EMPTY_A, MULTI, EMPTY_B, SINGLE])).toEqual([MULTI, SINGLE]);
  });
});

describe('ContextSelectorService', () => {
  let openDialog: jasmine.Spy;

  function setup(organizations: Organization[]) {
    openDialog = jasmine.createSpy('open').and.returnValue({ afterClosed: () => of(true) });
    TestBed.configureTestingModule({
      providers: [
        { provide: OrganizationService, useValue: { getOrganizations: () => of(organizations) } },
        { provide: MatDialog, useValue: { open: openDialog } },
      ],
    });
    return TestBed.inject(ContextSelectorService);
  }

  it('el modal recibe solo organizaciones con orquestaciones', () => {
    setup([EMPTY_A, MULTI, EMPTY_B, SINGLE]).open(false).subscribe();
    const data = openDialog.calls.mostRecent().args[1].data as ContextSelectorDialogData;
    expect(data.organizations.map((o) => o.name)).toEqual(['ARICNBSANTAFE', 'ECICBANCOGUAYAQUIL']);
  });

  it('si tras el filtro queda una sola organización con una sola orquestación, la elige sin abrir el modal', () => {
    setup([EMPTY_A, SINGLE, EMPTY_B]).open(false).subscribe();
    expect(openDialog).not.toHaveBeenCalled();
    const context = TestBed.inject(ContextService);
    expect(context.organization()?.name).toBe('ECICBANCOGUAYAQUIL');
    expect(context.orchestration()?.name).toBe('scorenuevaera');
  });

  it('si ninguna organización tiene orquestaciones, falla con NoOrganizationsError', () => {
    let error: unknown;
    setup([EMPTY_A, EMPTY_B])
      .open(false)
      .subscribe({ error: (e: unknown) => (error = e) });
    expect(error).toBeInstanceOf(NoOrganizationsError);
    expect(openDialog).not.toHaveBeenCalled();
  });

  it('indica "cargando" mientras obtiene las organizaciones', () => {
    const service = setup([MULTI]);
    expect(service.loading()).toBeFalse();
    service.open(false).subscribe();
    expect(service.loading()).toBeFalse();
  });
});
