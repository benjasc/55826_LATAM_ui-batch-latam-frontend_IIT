import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import {
  ContextSelectorService,
  NoOrganizationsError,
} from '@features/context-selector/context-selector.service';
import { App } from './app';

describe('App', () => {
  let open: jasmine.Spy;
  const loading = signal(false);

  function render() {
    TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([]), { provide: ContextSelectorService, useValue: { open, loading } }],
    });
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  it('al iniciar abre el modal obligatorio de organización', () => {
    open = jasmine.createSpy('open').and.returnValue(of(true));
    render();
    expect(open).toHaveBeenCalledWith(false);
  });

  it('si el backend responde 401 muestra el error y permite reintentar', () => {
    open = jasmine
      .createSpy('open')
      .and.returnValues(throwError(() => new HttpErrorResponse({ status: 401 })), of(true));
    const { fixture, el } = render();
    expect(el.textContent).toContain('No autorizado');

    el.querySelector<HTMLButtonElement>('.retry button')!.click();
    fixture.detectChanges();
    expect(open).toHaveBeenCalledTimes(2);
    expect(el.textContent).not.toContain('No autorizado');
  });

  it('si el usuario no tiene organizaciones lo informa', () => {
    open = jasmine.createSpy('open').and.returnValue(throwError(() => new NoOrganizationsError()));
    const { el } = render();
    expect(el.textContent).toContain('no tiene organizaciones con orquestaciones asociadas');
  });

  it('mientras se obtienen las organizaciones muestra la tarjeta de carga', () => {
    open = jasmine.createSpy('open').and.returnValue(of(true));
    loading.set(true);
    const { fixture, el } = render();
    expect(el.textContent).toContain('Cargando sus organizaciones…');

    loading.set(false);
    fixture.detectChanges();
    expect(el.textContent).not.toContain('Cargando sus organizaciones…');
  });

  it('si no hay conexión con el backend lo informa', () => {
    open = jasmine.createSpy('open').and.returnValue(throwError(() => new HttpErrorResponse({ status: 0 })));
    const { el } = render();
    expect(el.textContent).toContain('No fue posible conectar con el servidor');
  });
});
