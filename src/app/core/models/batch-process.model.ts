/** Códigos de estado de la tabla batch_status. */
export enum ProcessStatus {
  Pending = '001',
  Validation = '002',
  Execution = '003',
  Finished = '004',
  Cancelled = '005',
}

/** Estados que ve el cliente (PENDIENTE se muestra como Validación). */
export type VisibleStatus = 'validation' | 'execution' | 'finished' | 'cancelled';

export const VISIBLE_STATUS: Record<ProcessStatus, VisibleStatus> = {
  [ProcessStatus.Pending]: 'validation',
  [ProcessStatus.Validation]: 'validation',
  [ProcessStatus.Execution]: 'execution',
  [ProcessStatus.Finished]: 'finished',
  [ProcessStatus.Cancelled]: 'cancelled',
};

export const STATUS_LABEL: Record<VisibleStatus, string> = {
  validation: 'Validación',
  execution: 'Ejecución',
  finished: 'Finalizado',
  cancelled: 'Cancelado',
};

/** Proceso batch cargado por el usuario. Tabla: batch_process */
export interface BatchProcess {
  id: number;
  uuid: string;
  /** Usuario que cargó el archivo (batch_user.id). */
  userId: number;
  fileName: string;
  /** null hasta que el backend procese el archivo y cuente sus registros. */
  recordsQuantity: number | null;
  /** Fecha de creación del proceso (ISO 8601). */
  processDate: string;
  status: ProcessStatus;
  /** Cantidad de registros con error (genera el archivo de observaciones). */
  observationsQuantity: number;
}

/** Filtros de la pantalla Buscar Procesos. */
export interface ProcessSearchCriteria {
  /** Nombre de la organización activa. */
  organization: string;
  /** Nombre de la orquestación activa. */
  orchestration: string;
  userId: number;
  startDate: Date;
  endDate: Date;
}

/** Salida disponible solo cuando el proceso terminó correctamente. */
export function canDownloadOutput(process: BatchProcess): boolean {
  return process.status === ProcessStatus.Finished;
}

/** Observaciones disponibles si hubo registros con error en un proceso terminado o cancelado. */
export function canDownloadObservations(process: BatchProcess): boolean {
  const ended = process.status === ProcessStatus.Finished || process.status === ProcessStatus.Cancelled;
  return ended && process.observationsQuantity > 0;
}
