import { MAX_FILE_SIZE_BYTES, formatFileSize, validateCsvFile } from './csv-file.validator';

function fakeFile(name: string, size: number): File {
  const file = new File(['x'], name);
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

describe('validateCsvFile', () => {
  it('acepta un csv válido (también con extensión en mayúsculas)', () => {
    expect(validateCsvFile(fakeFile('clientes.csv', 100))).toBeNull();
    expect(validateCsvFile(fakeFile('CLIENTES.CSV', 100))).toBeNull();
  });

  it('rechaza archivos que no son csv', () => {
    expect(validateCsvFile(fakeFile('clientes.xlsx', 100))).toContain('formato csv');
    expect(validateCsvFile(fakeFile('clientes', 100))).toContain('formato csv');
  });

  it('exige más de 3 letras en el nombre', () => {
    expect(validateCsvFile(fakeFile('abc.csv', 100))).toContain('más de 3 letras');
    expect(validateCsvFile(fakeFile('abcd.csv', 100))).toBeNull();
  });

  it('rechaza archivos vacíos', () => {
    expect(validateCsvFile(fakeFile('clientes.csv', 0))).toContain('vacío');
  });

  it('rechaza archivos de más de 400 MB', () => {
    expect(validateCsvFile(fakeFile('clientes.csv', MAX_FILE_SIZE_BYTES + 1))).toContain('400 MB');
  });

  it('formatea tamaños', () => {
    expect(formatFileSize(500)).toBe('500 bytes');
    expect(formatFileSize(1536)).toBe('1,5 KB');
  });
});
