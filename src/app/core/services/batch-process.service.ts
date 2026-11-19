import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, defer, delay, map, of } from 'rxjs';

import { API } from '@core/config/api-endpoints';
import {
  BatchProcess,
  BatchProcessDto,
  CreateBatchProcessRequest,
  ProcessSearchCriteria,
  ProcessStatus,
  toBatchProcess,
} from '@core/models/batch-process.model';

const HOUR = 60 * 60_000;

/** Solo para el mock de búsqueda: nombre de cada estado como lo envía el backend. */
const MOCK_STATUS_NAME: Record<ProcessStatus, string> = {
  [ProcessStatus.Pending]: 'PENDIENTE',
  [ProcessStatus.Validation]: 'VALIDACIÓN',
  [ProcessStatus.Execution]: 'EJECUCIÓN',
  [ProcessStatus.Finished]: 'FINALIZADO',
  [ProcessStatus.Cancelled]: 'CANCELADO',
};

/** Headers con la organización y orquestación activas, requeridos por los endpoints de procesos. */
function contextHeaders(organization: string, orchestration: string): HttpHeaders {
  return new HttpHeaders({ organization, orchestration });
}

/**
 * MOCK de Buscar Procesos (aún sin endpoint): procesos de prueba repartidos en los últimos días
 * y entre los usuarios de prueba (ids 1, 2 y 3). La cantidad (5 a 34) se deriva del nombre.
 */
function buildMockSearchProcesses(orchestration: string): (BatchProcess & { userId: number })[] {
  const total = ([...orchestration].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 30) + 5;
  const today = new Date();
  const base = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 0, 0).getTime();

  return Array.from({ length: total }, (_, i) => {
    const fromNewest = total - 1 - i;
    const status =
      fromNewest === 0
        ? ProcessStatus.Pending
        : fromNewest === 1
          ? ProcessStatus.Execution
          : i % 4 === 3
            ? ProcessStatus.Cancelled
            : ProcessStatus.Finished;
    const fileName = `${orchestration}-${String(i + 1).padStart(3, '0')}.csv`;
    return {
      id: i + 1,
      userId: [1, 1, 2, 1, 3][i % 5],
      fileName,
      recordsQuantity: 50 + ((i * 37) % 900),
      createdAt: new Date(base - (total - 1 - i) * 19 * HOUR).toISOString(),
      status,
      statusLabel: MOCK_STATUS_NAME[status],
      hasSuccess: status === ProcessStatus.Finished,
      successFileName: null,
      hasErrors: false,
      errorFileName: null,
    };
  });
}

@Injectable({ providedIn: 'root' })
export class BatchProcessService {
  private readonly http = inject(HttpClient);

  /** Procesos del usuario del token para la organización/orquestación activa (Pizarra de Trabajo). */
  getProcesses(organization: string, orchestration: string): Observable<BatchProcess[]> {
    return this.http
      .get<BatchProcessDto[]>(API.listAll, { headers: contextHeaders(organization, orchestration) })
      .pipe(map((processes) => (processes ?? []).map(toBatchProcess)));
  }

  /**
   * Registra un nuevo proceso batch (estado PENDIENTE) con el nombre del archivo y su cantidad de registros.
   * TODO: la subida del archivo a MFT será un paso posterior.
   */
  createProcess(
    organization: string,
    orchestration: string,
    fileName: string,
    recordsQuantity: number,
  ): Observable<BatchProcess> {
    const body: CreateBatchProcessRequest = { filename: fileName, recordsQuantity };
    return this.http
      .post<BatchProcessDto>(API.batchProcesses, body, { headers: contextHeaders(organization, orchestration) })
      .pipe(map(toBatchProcess));
  }

  /**
   * Procesos de un usuario dentro de un rango de fechas (Buscar Procesos). Ambas fechas inclusive.
   * TODO: reemplazar por la llamada HTTP al backend cuando exista el endpoint.
   */
  searchProcesses(criteria: ProcessSearchCriteria): Observable<BatchProcess[]> {
    return defer(() => {
      const from = startOfDay(criteria.startDate).getTime();
      const to = startOfDay(criteria.endDate).getTime() + 24 * HOUR;
      const result = buildMockSearchProcesses(criteria.orchestration).filter((p) => {
        const time = new Date(p.createdAt).getTime();
        return p.userId === criteria.userId && time >= from && time < to;
      });
      return of(result);
    }).pipe(delay(500));
  }

  /** Archivo CSV procesado (salida). TODO: descargar desde el backend/MFT cuando exista el endpoint. */
  downloadOutput(process: BatchProcess): Observable<Blob> {
    void process;
    const csv = 'rut;nombre;score\n11111111-1;Cliente Ejemplo;750\n';
    return of(new Blob([csv], { type: 'text/csv;charset=utf-8' })).pipe(delay(200));
  }

  /** Archivo TXT con los registros con error. TODO: descargar desde el backend/MFT cuando exista el endpoint. */
  downloadObservations(process: BatchProcess): Observable<Blob> {
    void process;
    const txt = 'Línea 2: documento inválido\n';
    return of(new Blob([txt], { type: 'text/plain;charset=utf-8' })).pipe(delay(200));
  }
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
