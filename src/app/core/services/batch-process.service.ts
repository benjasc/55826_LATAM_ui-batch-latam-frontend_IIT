import { Injectable } from '@angular/core';
import { Observable, defer, delay, of } from 'rxjs';

import { BatchProcess, ProcessSearchCriteria, ProcessStatus } from '@core/models/batch-process.model';

const HOUR = 60 * 60_000;

/**
 * Genera procesos de prueba distintos según la orquestación elegida,
 * repartidos en los últimos días y entre los usuarios de prueba (ids 1, 2 y 3).
 */
function buildMockProcesses(orchestrationId: number): BatchProcess[] {
  const total = { 1: 12, 2: 40, 3: 0 }[orchestrationId] ?? 8;
  const today = new Date();
  const base = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 0, 0).getTime();

  // Los más antiguos ya terminaron; los 3 más recientes siguen en curso.
  const statusFor = (i: number): ProcessStatus => {
    const fromNewest = total - 1 - i;
    if (fromNewest === 0) return ProcessStatus.Pending;
    if (fromNewest === 1) return ProcessStatus.Validation;
    if (fromNewest === 2) return ProcessStatus.Execution;
    return i % 4 === 3 ? ProcessStatus.Cancelled : ProcessStatus.Finished;
  };

  return Array.from({ length: total }, (_, i) => {
    const status = statusFor(i);
    const ended = status === ProcessStatus.Finished || status === ProcessStatus.Cancelled;
    return {
      id: i + 1,
      uuid: `mock-${orchestrationId}-${i + 1}`,
      userId: [1, 1, 2, 1, 3][i % 5],
      fileName: `Archivo-${orchestrationId}-${String(i + 1).padStart(3, '0')}.csv`,
      recordsQuantity: ended ? 50 + ((i * 37) % 900) : null,
      processDate: new Date(base - (total - 1 - i) * 19 * HOUR).toISOString(),
      status,
      observationsQuantity: ended && i % 2 === 0 ? (i % 5) + 1 : 0,
    };
  });
}

@Injectable({ providedIn: 'root' })
export class BatchProcessService {
  /** "Base de datos" en memoria de los mocks, por orquestación. Se pierde al recargar la página. */
  private readonly mockStore = new Map<number, BatchProcess[]>();

  /**
   * Procesos del usuario para la organización/orquestación activa (Pizarra de Trabajo).
   * TODO: reemplazar por la llamada HTTP al backend.
   */
  getProcesses(organizationId: number, orchestrationId: number, userId: number): Observable<BatchProcess[]> {
    void organizationId;
    return defer(() => of(this.storeFor(orchestrationId).filter((p) => p.userId === userId))).pipe(delay(400));
  }

  /**
   * Procesos de un usuario dentro de un rango de fechas (Buscar Procesos). Ambas fechas inclusive.
   * TODO: reemplazar por la llamada HTTP al backend.
   */
  searchProcesses(criteria: ProcessSearchCriteria): Observable<BatchProcess[]> {
    return defer(() => {
      const from = startOfDay(criteria.startDate).getTime();
      const to = startOfDay(criteria.endDate).getTime() + 24 * HOUR;
      const result = this.storeFor(criteria.orchestrationId).filter((p) => {
        const time = new Date(p.processDate).getTime();
        return p.userId === criteria.userId && time >= from && time < to;
      });
      return of(result);
    }).pipe(delay(500));
  }

  /**
   * Sube el archivo y registra un nuevo proceso en estado PENDIENTE.
   * TODO: reemplazar por la subida a MFT + creación del proceso en el backend.
   */
  createProcess(organizationId: number, orchestrationId: number, userId: number, file: File): Observable<BatchProcess> {
    void organizationId;
    return defer(() => {
      const store = this.storeFor(orchestrationId);
      const process: BatchProcess = {
        id: Math.max(0, ...store.map((p) => p.id)) + 1,
        uuid: crypto.randomUUID(),
        userId,
        fileName: file.name,
        recordsQuantity: null,
        processDate: new Date().toISOString(),
        status: ProcessStatus.Pending,
        observationsQuantity: 0,
      };
      store.push(process);
      return of(process);
    }).pipe(delay(1500));
  }

  /** Archivo CSV procesado (salida). TODO: descargar desde el backend/MFT. */
  downloadOutput(process: BatchProcess): Observable<Blob> {
    void process;
    const csv = 'rut;nombre;score\n11111111-1;Cliente Ejemplo;750\n';
    return of(new Blob([csv], { type: 'text/csv;charset=utf-8' })).pipe(delay(200));
  }

  /** Archivo TXT con los registros con error. TODO: descargar desde el backend/MFT. */
  downloadObservations(process: BatchProcess): Observable<Blob> {
    const lines = Array.from(
      { length: process.observationsQuantity },
      (_, i) => `Línea ${i + 2}: documento inválido`,
    );
    return of(new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })).pipe(delay(200));
  }

  private storeFor(orchestrationId: number): BatchProcess[] {
    if (!this.mockStore.has(orchestrationId)) {
      this.mockStore.set(orchestrationId, buildMockProcesses(orchestrationId));
    }
    return this.mockStore.get(orchestrationId)!;
  }
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
