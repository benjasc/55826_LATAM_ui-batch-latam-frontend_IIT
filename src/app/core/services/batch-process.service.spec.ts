import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { BatchProcess, ProcessStatus } from '@core/models/batch-process.model';
import { BatchProcessService } from './batch-process.service';

describe('BatchProcessService', () => {
  let service: BatchProcessService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(BatchProcessService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('lista los procesos con GET /listall, headers de contexto, y los convierte al modelo', () => {
    let result: BatchProcess[] | undefined;
    service.getProcesses('ECICBANCOBOLIVARIANO', 'modelobolivariano').subscribe((p) => (result = p));

    const req = httpMock.expectOne('/ui-batch-latam-backend/api/listall');
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('organization')).toBe('ECICBANCOBOLIVARIANO');
    expect(req.request.headers.get('orchestration')).toBe('modelobolivariano');
    req.flush([
      {
        id: 2,
        fileName: 'new_file.csv',
        fileProcess: null,
        recordsQuantity: 3333,
        createdAt: '2026-11-19T21:19:56.721Z',
        processDate: null,
        processEndDate: null,
        uuid: null,
        statusCode: '001',
        status: 'PENDIENTE',
        organization: 'ECICBANCOBOLIVARIANO',
        orchestration: 'modelobolivariano',
        hasErrors: null,
        errorFilename: null,
        hasSuccess: true,
        successFilename: 'new_file_out.csv',
      },
    ]);

    expect(result).toEqual([
      {
        id: 2,
        fileName: 'new_file.csv',
        recordsQuantity: 3333,
        createdAt: '2026-11-19T21:19:56.721Z',
        status: ProcessStatus.Pending,
        statusLabel: 'PENDIENTE',
        hasSuccess: true,
        successFileName: 'new_file_out.csv',
        hasErrors: false,
        errorFileName: null,
      },
    ]);
  });

  it('crea el proceso con POST /batch-processes { filename, recordsQuantity } y headers de contexto', () => {
    let created: BatchProcess | undefined;
    service
      .createProcess('ECICBANCOBOLIVARIANO', 'modelobolivariano', 'new_file.csv', 3333)
      .subscribe((p) => (created = p));

    const req = httpMock.expectOne('/ui-batch-latam-backend/api/batch-processes');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ filename: 'new_file.csv', recordsQuantity: 3333 });
    expect(req.request.headers.get('organization')).toBe('ECICBANCOBOLIVARIANO');
    expect(req.request.headers.get('orchestration')).toBe('modelobolivariano');
    req.flush({
      id: 2,
      fileName: 'new_file.csv',
      recordsQuantity: 3333,
      statusCode: '001',
      status: 'PENDIENTE',
      organization: 'ECICBANCOBOLIVARIANO',
      orchestration: 'modelobolivariano',
    });

    expect(created?.id).toBe(2);
    expect(created?.status).toBe(ProcessStatus.Pending);
    expect(created?.hasSuccess).toBeFalse();
  });
});
