/** Descarga un Blob en el navegador con el nombre indicado. */
export function saveFile(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

/** "datos.csv" -> "datos_salida.csv" */
export function withSuffix(fileName: string, suffix: string, extension: string): string {
  const base = fileName.replace(/\.[^.]+$/, '');
  return `${base}_${suffix}.${extension}`;
}
