import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { BatchProcessService } from '@core/services/batch-process.service';
import { ContextService } from '@core/services/context.service';
import { NotificationService } from '@core/services/notification.service';
import { NewProcessPage } from './new-process-page';

describe('NewProcessPage', () => {
  let createProcess: jasmine.Spy;
  let notification: jasmine.SpyObj<NotificationService>;

  /** Espera a que termine el conteo de registros (lectura asíncrona del archivo). */
  async function settle(fixture: ComponentFixture<NewProcessPage>): Promise<void> {
    for (let i = 0; i < 20; i++) {
      await new Promise((resolve) => setTimeout(resolve));
      fixture.detectChanges();
      if (!(fixture.componentInstance as any).counting()) {
        return;
      }
    }
  }

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
    TestBed.inject(ContextService).setContext({ name: 'ORG', orchestrations: [{ name: 'm' }] }, { name: 'm' });
    const fixture = TestBed.createComponent(NewProcessPage);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    const selectFile = async (file: File) => {
      const input = el.querySelector<HTMLInputElement>('input[type=file]')!;
      const transfer = new DataTransfer();
      transfer.items.add(file);
      input.files = transfer.files;
      input.dispatchEvent(new Event('change'));
      await settle(fixture);
    };
    const finishButton = () =>
      Array.from(el.querySelectorAll<HTMLButtonElement>('button')).find((b) => b.textContent?.includes('Finalizar'))!;

    return { fixture, el, selectFile, finishButton };
  }

  it('Finalizar está deshabilitado sin archivo', () => {
    const { finishButton } = render();
    expect(finishButton().disabled).toBeTrue();
  });

  it('muestra el error y no selecciona un archivo inválido', async () => {
    const { el, selectFile, finishButton } = render();
    await selectFile(new File(['a;b'], 'datos.txt'));
    expect(el.textContent).toContain('El archivo debe estar en formato csv.');
    expect(el.textContent).toContain('Ningún archivo seleccionado');
    expect(finishButton().disabled).toBeTrue();
  });

  it('cuenta los registros del csv (sin encabezado) y habilita Finalizar', async () => {
    const { el, selectFile, finishButton } = render();
    await selectFile(new File(['11111111-1;Juan\n22222222-2;Ana\n'], 'clientes.csv'));
    expect(el.textContent).toContain('clientes.csv');
    expect(el.textContent).toContain('2 registros');
    expect(finishButton().disabled).toBeFalse();
  });

  it('rechaza un csv que solo tiene líneas vacías', async () => {
    const { el, selectFile, finishButton } = render();
    await selectFile(new File(['\n  \n'], 'clientes.csv'));
    expect(el.textContent).toContain('El archivo no debe venir vacío.');
    expect(finishButton().disabled).toBeTrue();
  });

  it('permite eliminar el archivo', async () => {
    const { fixture, el, selectFile, finishButton } = render();
    await selectFile(new File(['a;1'], 'clientes.csv'));
    el.querySelector<HTMLButtonElement>('button[aria-label="Eliminar archivo"]')!.click();
    fixture.detectChanges();
    expect(el.textContent).toContain('Ningún archivo seleccionado');
    expect(finishButton().disabled).toBeTrue();
  });

  it('al finalizar crea el proceso con nombre y cantidad, avisa y vuelve a la Pizarra', async () => {
    const { selectFile, finishButton } = render();
    const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    await selectFile(new File(['a;1\nb;2\nc;3'], 'clientes.csv'));
    finishButton().click();

    expect(createProcess).toHaveBeenCalledWith('ORG', 'm', 'clientes.csv', 3);
    expect(notification.success).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['/workboard']);
  });

  it('si la creación falla, avisa y se queda en la pantalla', async () => {
    const { selectFile, finishButton } = render();
    createProcess.and.returnValue(throwError(() => new Error('falló')));
    const navigate = spyOn(TestBed.inject(Router), 'navigate');
    await selectFile(new File(['a;1'], 'clientes.csv'));
    finishButton().click();

    expect(notification.error).toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });
});
