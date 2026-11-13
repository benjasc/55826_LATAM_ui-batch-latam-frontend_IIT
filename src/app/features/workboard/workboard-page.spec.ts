import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { BatchProcess, ProcessStatus, canDownloadObservations, canDownloadOutput } from '@core/models/batch-process.model';
import { BatchProcessService } from '@core/services/batch-process.service';
import { ContextService } from '@core/services/context.service';
import { WorkboardPage } from './workboard-page';

function process(id: number, status: ProcessStatus, date: string, observations = 0): BatchProcess {
  return {
    id,
    uuid: `u-${id}`,
    userId: 1,
    fileName: `archivo-${id}.csv`,
    recordsQuantity: 10,
    processDate: date,
    status,
    observationsQuantity: observations,
  };
}

const PROCESSES: BatchProcess[] = [
  process(1, ProcessStatus.Finished, '2026-11-01T10:00:00Z', 2),
  process(2, ProcessStatus.Cancelled, '2026-11-03T10:00:00Z', 0),
  process(3, ProcessStatus.Pending, '2026-11-02T10:00:00Z'),
];

describe('Reglas de descarga', () => {
  it('Salida solo en FINALIZADO', () => {
    expect(canDownloadOutput(process(1, ProcessStatus.Finished, ''))).toBeTrue();
    expect(canDownloadOutput(process(1, ProcessStatus.Cancelled, ''))).toBeFalse();
    expect(canDownloadOutput(process(1, ProcessStatus.Execution, ''))).toBeFalse();
  });

  it('Ver Obs. solo si terminó (finalizado o cancelado) y hubo errores', () => {
    expect(canDownloadObservations(process(1, ProcessStatus.Finished, '', 3))).toBeTrue();
    expect(canDownloadObservations(process(1, ProcessStatus.Cancelled, '', 1))).toBeTrue();
    expect(canDownloadObservations(process(1, ProcessStatus.Finished, '', 0))).toBeFalse();
    expect(canDownloadObservations(process(1, ProcessStatus.Execution, '', 5))).toBeFalse();
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
    TestBed.inject(ContextService).setContext(
      { name: 'ORG', orchestrations: [{ name: 'm' }] },
      { name: 'm' },
    );
    const fixture = TestBed.createComponent(WorkboardPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('carga los procesos de la organización y orquestación activas', async () => {
    await render();
    expect(getProcesses).toHaveBeenCalledWith('ORG', 'm', 1);
  });

  it('ordena más recientes primero con número correlativo descendente', async () => {
    const el = await render();
    const rows = Array.from(el.querySelectorAll('tr.mat-mdc-row'));
    const cells = rows.map((r) => [r.children[0].textContent?.trim(), r.children[1].textContent?.trim()]);
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

  it('habilita Salida / Ver Obs. según el estado', async () => {
    const el = await render();
    const rows = Array.from(el.querySelectorAll('tr.mat-mdc-row'));
    const disabled = rows.map((r) =>
      Array.from(r.querySelectorAll<HTMLButtonElement>('button')).map((b) => b.disabled),
    );
    // [Salida, Ver Obs.] por fila: cancelado sin errores, pendiente, finalizado con errores
    expect(disabled).toEqual([
      [true, true],
      [true, true],
      [false, false],
    ]);
  });
});
