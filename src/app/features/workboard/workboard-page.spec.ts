import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import {
  BatchProcess,
  ProcessStatus,
  canDownloadObservations,
  canDownloadOutput,
} from '@core/models/batch-process.model';
import { BatchProcessService } from '@core/services/batch-process.service';
import { ContextService } from '@core/services/context.service';
import { WorkboardPage } from './workboard-page';

function process(
  id: number,
  status: ProcessStatus,
  createdAt: string,
  flags: { hasSuccess?: boolean; hasErrors?: boolean } = {},
): BatchProcess {
  return {
    id,
    fileName: `archivo-${id}.csv`,
    recordsQuantity: 10,
    createdAt,
    status,
    hasSuccess: flags.hasSuccess ?? false,
    successFileName: flags.hasSuccess ? `archivo-${id}_salida.csv` : null,
    hasErrors: flags.hasErrors ?? false,
    errorFileName: flags.hasErrors ? `archivo-${id}_errores.txt` : null,
  };
}

const PROCESSES: BatchProcess[] = [
  process(1, ProcessStatus.Finished, '2026-11-01T10:00:00Z', { hasSuccess: true, hasErrors: true }),
  process(2, ProcessStatus.Cancelled, '2026-11-03T10:00:00Z', { hasErrors: true }),
  process(3, ProcessStatus.Pending, '2026-11-02T10:00:00Z'),
];

describe('Reglas de descarga', () => {
  it('Salida y Ver Obs. dependen de lo que informa el backend (hasSuccess / hasErrors)', () => {
    expect(canDownloadOutput(process(1, ProcessStatus.Finished, '', { hasSuccess: true }))).toBeTrue();
    expect(canDownloadOutput(process(1, ProcessStatus.Finished, ''))).toBeFalse();
    expect(canDownloadObservations(process(1, ProcessStatus.Cancelled, '', { hasErrors: true }))).toBeTrue();
    expect(canDownloadObservations(process(1, ProcessStatus.Finished, ''))).toBeFalse();
  });
});

describe('WorkboardPage', () => {
  let getProcesses: jasmine.Spy;

  async function render() {
    getProcesses = jasmine.createSpy('getProcesses').and.returnValue(of(PROCESSES));
    TestBed.configureTestingModule({
      imports: [WorkboardPage],
      providers: [provideRouter([]), { provide: BatchProcessService, useValue: { getProcesses } }],
    });
    TestBed.inject(ContextService).setContext({ name: 'ORG', orchestrations: [{ name: 'm' }] }, { name: 'm' });
    const fixture = TestBed.createComponent(WorkboardPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  const dataRows = (el: HTMLElement) => Array.from(el.querySelectorAll('tr.mat-mdc-row:not(.mat-mdc-no-data-row)'));

  it('carga los procesos de la organización y orquestación activas', async () => {
    await render();
    expect(getProcesses).toHaveBeenCalledWith('ORG', 'm');
  });

  it('ordena más recientes primero con número correlativo descendente', async () => {
    const el = await render();
    const cells = dataRows(el).map((r) => [r.children[0].textContent?.trim(), r.children[1].textContent?.trim()]);
    expect(cells).toEqual([
      ['3', 'archivo-2.csv'],
      ['2', 'archivo-3.csv'],
      ['1', 'archivo-1.csv'],
    ]);
  });

  it('muestra PENDIENTE como Validación', async () => {
    const el = await render();
    expect(el.textContent).toContain('Validación');
    expect(el.textContent).not.toContain('Pendiente');
  });

  it('habilita Salida / Ver Obs. según hasSuccess / hasErrors', async () => {
    const el = await render();
    const disabled = dataRows(el).map((r) =>
      Array.from(r.querySelectorAll<HTMLButtonElement>('button')).map((b) => b.disabled),
    );
    // [Salida, Ver Obs.] por fila: cancelado con errores, pendiente, finalizado con salida y errores
    expect(disabled).toEqual([
      [true, false],
      [true, true],
      [false, false],
    ]);
  });
});
