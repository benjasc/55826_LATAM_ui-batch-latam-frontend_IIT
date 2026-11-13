import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { BatchProcessService } from '@core/services/batch-process.service';
import { ContextService } from '@core/services/context.service';
import { NotificationService } from '@core/services/notification.service';
import { NewProcessPage } from './new-process-page';

describe('NewProcessPage', () => {
  let createProcess: jasmine.Spy;
  let notification: jasmine.SpyObj<NotificationService>;

  function render() {
    createProcess = jasmine.createSpy('createProcess').and.returnValue(of({}));
    notification = jasmine.createSpyObj('NotificationService', ['success', 'error']);
    TestBed.configureTestingModule({
      imports: [NewProcessPage],
      providers: [
        provideRouter([]),
        { provide: BatchProcessService, useValue: { createProcess } },
        { provide: NotificationService, useValue: notification },
      ],
    });
    TestBed.inject(ContextService).setContext(
      { id: 1, name: 'ORG', orchestrations: [{ id: 9, name: 'm' }] },
      { id: 9, name: 'm' },
    );
    const fixture = TestBed.createComponent(NewProcessPage);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    const selectFile = (file: File) => {
      const input = el.querySelector<HTMLInputElement>('input[type=file]')!;
      const transfer = new DataTransfer();
      transfer.items.add(file);
      input.files = transfer.files;
      input.dispatchEvent(new Event('change'));
      fixture.detectChanges();
    };
    const finishButton = () =>
      Array.from(el.querySelectorAll<HTMLButtonElement>('button')).find((b) => b.textContent?.includes('Finalizar'))!;

    return { fixture, el, selectFile, finishButton };
  }

  it('Finalizar está deshabilitado sin archivo', () => {
    const { finishButton } = render();
    expect(finishButton().disabled).toBeTrue();
  });

  it('muestra el error y no selecciona un archivo inválido', () => {
    const { el, selectFile, finishButton } = render();
    selectFile(new File(['a;b'], 'datos.txt'));
    expect(el.textContent).toContain('El archivo debe estar en formato csv.');
    expect(el.textContent).toContain('Ningún archivo seleccionado');
    expect(finishButton().disabled).toBeTrue();
  });

  it('habilita Finalizar con un csv válido y permite eliminarlo', () => {
    const { fixture, el, selectFile, finishButton } = render();
    selectFile(new File(['rut;nombre'], 'clientes.csv'));
    expect(el.textContent).toContain('clientes.csv');
    expect(finishButton().disabled).toBeFalse();

    el.querySelector<HTMLButtonElement>('button[aria-label="Eliminar archivo"]')!.click();
    fixture.detectChanges();
    expect(el.textContent).toContain('Ningún archivo seleccionado');
    expect(finishButton().disabled).toBeTrue();
  });

  it('al finalizar crea el proceso, avisa y vuelve a la Pizarra', () => {
    const { selectFile, finishButton } = render();
    const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    const file = new File(['rut;nombre'], 'clientes.csv');
    selectFile(file);
    finishButton().click();

    expect(createProcess).toHaveBeenCalledWith(1, 9, 1, file);
    expect(notification.success).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['/workboard']);
  });

  it('si la carga falla, avisa y se queda en la pantalla', () => {
    const { selectFile, finishButton } = render();
    createProcess.and.returnValue(throwError(() => new Error('falló')));
    const navigate = spyOn(TestBed.inject(Router), 'navigate');
    selectFile(new File(['rut;nombre'], 'clientes.csv'));
    finishButton().click();

    expect(notification.error).toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });
});
