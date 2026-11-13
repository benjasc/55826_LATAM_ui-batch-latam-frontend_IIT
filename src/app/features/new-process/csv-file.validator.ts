/** Tamaño máximo permitido (mismo límite que la UI anterior). */
export const MAX_FILE_SIZE_BYTES = 400 * 1024 * 1024;

/** Largo mínimo del nombre del archivo, sin extensión ("más de 3 letras"). */
export const MIN_NAME_LENGTH = 4;

/**
 * Valida el archivo de entrada de un proceso batch.
 * @returns el mensaje de error a mostrar, o null si el archivo es válido.
 */
export function validateCsvFile(file: File): string | null {
  const dotIndex = file.name.lastIndexOf('.');
  const extension = dotIndex >= 0 ? file.name.slice(dotIndex + 1).toLowerCase() : '';
  const baseName = dotIndex >= 0 ? file.name.slice(0, dotIndex) : file.name;

  if (extension !== 'csv') {
    return 'El archivo debe estar en formato csv.';
  }
  if (baseName.trim().length < MIN_NAME_LENGTH) {
    return 'El nombre del archivo debe tener más de 3 letras, además de su extensión.';
  }
  if (file.size === 0) {
    return 'El archivo no debe venir vacío.';
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return 'El tamaño del archivo supera el máximo permitido de 400 MB.';
  }
  return null;
}

/** 1536 -> "1,5 KB" */
export function formatFileSize(bytes: number): string {
  const units = ['bytes', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit++;
  }
  const value = unit === 0 ? String(size) : size.toLocaleString('es', { maximumFractionDigits: 1 });
  return `${value} ${units[unit]}`;
}
