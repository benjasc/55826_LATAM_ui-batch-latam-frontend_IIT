import { countCsvRecords } from './count-csv-records';

const csv = (content: string) => new Blob([content], { type: 'text/csv' });

describe('countCsvRecords', () => {
  it('cuenta todas las filas, incluida la primera (no hay encabezado)', async () => {
    expect(await countCsvRecords(csv('11111111-1;Juan\n22222222-2;Ana\n33333333-3;Luis\n'))).toBe(3);
  });

  it('cuenta la última fila aunque no termine en salto de línea', async () => {
    expect(await countCsvRecords(csv('a;1\nb;2'))).toBe(2);
  });

  it('soporta finales de línea de Windows (\\r\\n)', async () => {
    expect(await countCsvRecords(csv('a;1\r\nb;2\r\nc;3\r\n'))).toBe(3);
  });

  it('ignora líneas vacías o solo con espacios', async () => {
    expect(await countCsvRecords(csv('a;1\n\n   \nb;2\n\n'))).toBe(2);
  });

  it('un archivo sin contenido tiene 0 registros', async () => {
    expect(await countCsvRecords(csv(''))).toBe(0);
    expect(await countCsvRecords(csv('\n\r\n  \n'))).toBe(0);
  });

  it('cuenta correctamente archivos grandes leídos en varias partes', async () => {
    const rows = 200_000;
    const content = Array.from({ length: rows }, (_, i) => `${i};registro`).join('\n');
    expect(await countCsvRecords(csv(content))).toBe(rows);
  });
});
