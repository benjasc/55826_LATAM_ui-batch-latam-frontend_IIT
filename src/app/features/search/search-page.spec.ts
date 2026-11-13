import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { BatchProcess, ProcessStatus } from '@core/models/batch-process.model';
import { provideSpanishDates } from '@core/i18n/spanish-date-adapter';
import { Role } from '@core/models/user.model';
import { BatchProcessService } from '@core/services/batch-process.service';
import { ContextService } from '@core/services/context.service';
import { MOCK_USERS, UserService } from '@core/services/user.service';
import { SearchPage } from './search-page';

const RESULTS: BatchProcess[] = [
  {
    id: 1,
    uuid: 'a',
    userId: 2,
    fileName: 'reciente.csv',
    recordsQuantity: 5,
    processDate: '2026-11-05T10:00:00Z',
    status: ProcessStatus.Finished,
    observationsQuantity: 0,
  },
  {
    id: 2,
    uuid: 'b',
    userId: 2,
    fileName: 'antiguo.csv',
    recordsQuantity: null,
    processDate: '2026-11-01T10:00:00Z',
    status: ProcessStatus.Execution,
    observationsQuantity: 0,
  },
];

describe('SearchPage', () => {
  let searchProcesses: jasmine.Spy;

  async function render(isAdmin: boolean) {
    searchProcesses = jasmine.createSpy('searchProcesses').and.returnValue(of(RESULTS));
    TestBed.configureTestingModule({
      imports: [SearchPage],
      providers: [provideSpanishDates(), { provide: BatchProcessService, useValue: { searchProcesses } }],
    });
    const userService = TestBed.inject(UserService);
    spyOn(userService, 'isAdmin').and.returnValue(isAdmin);
    spyOn(userService, 'currentUser').and.returnValue({ ...MOCK_USERS[0], roles: [Role.User] });
    spyOn(userService, 'getOrganizationUsers').and.returnValue(of(MOCK_USERS));
    TestBed.inject(ContextService).setContext(
      { id: 1, name: 'ORG', orchestrations: [{ id: 9, name: 'm' }] },
      { id: 9, name: 'm' },
    );

    const fixture = TestBed.createComponent(SearchPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const cmp = fixture.componentInstance as any;
    const settle = async () => {
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
    };
    return { el, cmp, settle };
  }

  it('el selector de usuario solo aparece para administradores', async () => {
    expect((await render(false)).el.textContent).not.toContain('Usuario');
    TestBed.resetTestingModule();
    expect((await render(true)).el.textContent).toContain('Usuario');
  });

  it('antes de buscar muestra la indicación y Buscar está deshabilitado', async () => {
    const { el } = await render(false);
    expect(el.textContent).toContain('Seleccione un rango de fechas y presione Buscar.');
    const buscar = Array.from(el.querySelectorAll('button')).find((b) => b.textContent?.includes('Buscar'))!;
    expect(buscar.disabled).toBeTrue();
  });

  it('busca con las fechas, el usuario y el contexto, y numera en orden cronológico', async () => {
    const { el, cmp, settle } = await render(true);
    cmp.form.setValue({ startDate: new Date(2026, 10, 1), endDate: new Date(2026, 10, 6), userId: 2 });
    cmp.search();
    await settle();

    expect(searchProcesses).toHaveBeenCalledWith({
      startDate: new Date(2026, 10, 1),
      endDate: new Date(2026, 10, 6),
      userId: 2,
      organizationId: 1,
      orchestrationId: 9,
    });
    const rows = Array.from(el.querySelectorAll('tr.mat-mdc-row:not(.mat-mdc-no-data-row)')).map((r) => [
      r.children[0].textContent?.trim(),
      r.children[1].textContent?.trim(),
    ]);
    expect(rows).toEqual([
      ['1', 'antiguo.csv'],
      ['2', 'reciente.csv'],
    ]);
  });

  it('no permite buscar con un rango mayor a 30 días', async () => {
    const { cmp } = await render(false);
    cmp.form.patchValue({ startDate: new Date(2026, 0, 1), endDate: new Date(2026, 1, 15) });
    expect(cmp.form.hasError('rangeTooLong')).toBeTrue();
    cmp.search();
    expect(searchProcesses).not.toHaveBeenCalled();
  });

  it('Limpiar borra las fechas y los resultados', async () => {
    const { el, cmp, settle } = await render(false);
    cmp.form.patchValue({ startDate: new Date(2026, 10, 1), endDate: new Date(2026, 10, 6) });
    cmp.search();
    await settle();
    expect(el.querySelectorAll('tr.mat-mdc-row:not(.mat-mdc-no-data-row)').length).toBe(2);

    cmp.clear();
    await settle();
    expect(cmp.form.controls.startDate.value).toBeNull();
    expect(el.querySelectorAll('tr.mat-mdc-row:not(.mat-mdc-no-data-row)').length).toBe(0);
    expect(el.textContent).toContain('Seleccione un rango de fechas y presione Buscar.');
  });
});
