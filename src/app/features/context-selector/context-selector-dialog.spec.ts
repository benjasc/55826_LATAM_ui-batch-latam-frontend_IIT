import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { Organization } from '@core/models/organization.model';
import { ContextService } from '@core/services/context.service';
import { ContextSelectorDialog, ContextSelectorDialogData } from './context-selector-dialog';

const ORGANIZATIONS: Organization[] = [
  { name: 'ORG MULTI', orchestrations: [{ name: 'm1' }, { name: 'm2' }] },
  { name: 'ORG UNICA', orchestrations: [{ name: 'm3' }] },
  { name: 'ORG VACIA', orchestrations: [] },
];

describe('ContextSelectorDialog', () => {
  let close: jasmine.Spy;

  function create(data: ContextSelectorDialogData, before?: () => void) {
    close = jasmine.createSpy('close');
    TestBed.configureTestingModule({
      imports: [ContextSelectorDialog],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: MatDialogRef, useValue: { close } },
      ],
    });
    before?.();
    const fixture = TestBed.createComponent(ContextSelectorDialog);
    fixture.detectChanges();
    // Acceso a miembros protegidos solo para la prueba.
    return { fixture, cmp: fixture.componentInstance as any, el: fixture.nativeElement as HTMLElement };
  }

  it('inicia sin selección y con Aceptar deshabilitado', () => {
    const { cmp, el } = create({ organizations: ORGANIZATIONS, dismissible: false });
    expect(cmp.form.invalid).toBeTrue();
    expect(el.querySelector<HTMLButtonElement>('button[type=submit]')!.disabled).toBeTrue();
    expect(el.textContent).not.toContain('Cancelar');
  });

  it('autoselecciona la orquestación cuando la organización tiene solo una', () => {
    const { cmp } = create({ organizations: ORGANIZATIONS, dismissible: false });
    cmp.form.controls.organization.setValue(ORGANIZATIONS[1]);
    expect(cmp.form.controls.orchestration.value).toEqual({ name: 'm3' });
    expect(cmp.showOrchestrationSelect()).toBeFalse();
  });

  it('limpia la orquestación al cambiar de organización', () => {
    const { cmp } = create({ organizations: ORGANIZATIONS, dismissible: false });
    cmp.form.controls.organization.setValue(ORGANIZATIONS[0]);
    cmp.form.controls.orchestration.setValue(ORGANIZATIONS[0].orchestrations[1]);
    cmp.form.controls.organization.setValue(ORGANIZATIONS[1]);
    expect(cmp.form.controls.orchestration.value?.name).toBe('m3');
  });

  it('marca error si la organización no tiene orquestaciones', () => {
    const { cmp } = create({ organizations: ORGANIZATIONS, dismissible: false });
    cmp.form.controls.organization.setValue(ORGANIZATIONS[2]);
    expect(cmp.form.controls.organization.hasError('noOrchestrations')).toBeTrue();
    expect(cmp.form.invalid).toBeTrue();
  });

  it('al aceptar guarda el contexto y cierra con true', () => {
    const { cmp } = create({ organizations: ORGANIZATIONS, dismissible: false });
    cmp.form.controls.organization.setValue(ORGANIZATIONS[0]);
    cmp.form.controls.orchestration.setValue(ORGANIZATIONS[0].orchestrations[1]);
    cmp.accept();
    const context = TestBed.inject(ContextService);
    expect(context.organization()?.name).toBe('ORG MULTI');
    expect(context.orchestration()?.name).toBe('m2');
    expect(close).toHaveBeenCalledWith(true);
  });

  it('al reabrir precarga el contexto actual y muestra Cancelar', () => {
    const { cmp, el } = create({ organizations: ORGANIZATIONS, dismissible: true }, () =>
      TestBed.inject(ContextService).setContext(ORGANIZATIONS[0], ORGANIZATIONS[0].orchestrations[1]),
    );
    expect(cmp.form.controls.organization.value?.name).toBe('ORG MULTI');
    expect(cmp.form.controls.orchestration.value?.name).toBe('m2');
    expect(el.textContent).toContain('Cancelar');
  });
});
