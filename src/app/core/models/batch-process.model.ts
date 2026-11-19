/** Códigos de estado de la tabla batch_status (campo statusCode del API). */
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

/** Proceso batch del usuario (modelo del front). Tabla: batch_process */
export interface BatchProcess {
  id: number;
  fileName: string;
  /** Cantidad de registros del archivo de entrada (null si el backend no la informa). */
  recordsQuantity: number | null;
  /** Fecha de creación del proceso (ISO 8601). Es la "Fecha del Procesamiento" que ve el usuario. */
  createdAt: string;
  status: ProcessStatus;
  /** Hay archivo de salida (CSV procesado) para descargar. */
  hasSuccess: boolean;
  successFileName: string | null;
  /** Hay archivo de observaciones (registros con error) para descargar. */
  hasErrors: boolean;
  errorFileName: string | null;
}

/**
 * Proceso batch tal como lo devuelve el backend:
 * GET /api/listall (lista) y POST /api/batch-processes (proceso creado, con menos campos).
 */
export interface BatchProcessDto {
  id: number;
  fileName: string;
  fileProcess?: string | null;
  recordsQuantity: number | null;
  createdAt?: string | null;
  processDate?: string | null;
  processEndDate?: string | null;
  uuid?: string | null;
  statusCode: string;
  status: string;
  organization: string;
  orchestration: string;
  hasErrors?: boolean | null;
  errorFilename?: string | null;
  hasSuccess?: boolean | null;
  successFilename?: string | null;
}

/** Body de POST /api/batch-processes. */
export interface CreateBatchProcessRequest {
  filename: string;
  recordsQuantity: number;
}

/** Convierte la respuesta del backend al modelo del front. */
export function toBatchProcess(dto: BatchProcessDto): BatchProcess {
  return {
    id: dto.id,
    fileName: dto.fileName,
    recordsQuantity: dto.recordsQuantity ?? null,
    createdAt: dto.createdAt ?? new Date().toISOString(),
    status: dto.statusCode as ProcessStatus,
    hasSuccess: dto.hasSuccess === true,
    successFileName: dto.successFilename ?? null,
    hasErrors: dto.hasErrors === true,
    errorFileName: dto.errorFilename ?? null,
  };
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

/** "Salida" se habilita cuando el backend informa que hay archivo de salida. */
export function canDownloadOutput(process: BatchProcess): boolean {
  return process.hasSuccess;
}

/** "Ver Obs." se habilita cuando el backend informa que hay archivo de observaciones. */
export function canDownloadObservations(process: BatchProcess): boolean {
  return process.hasErrors;
}
