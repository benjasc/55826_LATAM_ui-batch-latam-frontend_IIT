const LF = 0x0a; // \n
const CR = 0x0d; // \r
const SPACE = 0x20;
const TAB = 0x09;

/**
 * Cuenta las filas con contenido de un CSV (el archivo NO tiene encabezado: todas las filas son registros).
 * - Ignora líneas vacías o solo con espacios (por ejemplo, el salto de línea final).
 * - Soporta finales de línea \n y \r\n, y archivos sin salto de línea al final.
 * - Lee el archivo por partes (stream), sin cargarlo completo en memoria (hasta 400 MB).
 */
export async function countCsvRecords(file: Blob): Promise<number> {
  const reader = file.stream().getReader();
  let records = 0;
  let lineHasContent = false;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    for (let i = 0; i < value.length; i++) {
      const byte = value[i];
      if (byte === LF) {
        if (lineHasContent) {
          records++;
        }
        lineHasContent = false;
      } else if (byte !== CR && byte !== SPACE && byte !== TAB) {
        lineHasContent = true;
      }
    }
  }

  return lineHasContent ? records + 1 : records;
}
