import { TestBed } from '@angular/core/testing';

import { StatusBadge } from './status-badge';

describe('StatusBadge', () => {
  function render(status: string, label: string) {
    const fixture = TestBed.createComponent(StatusBadge);
    fixture.componentRef.setInput('status', status);
    fixture.componentRef.setInput('label', label);
    fixture.detectChanges();
    return fixture.nativeElement.querySelector('span') as HTMLSpanElement;
  }

  it('muestra el texto del API y el color según el código', () => {
    const pending = render('001', 'PENDIENTE');
    expect(pending.textContent?.trim()).toBe('PENDIENTE');
    expect(pending.classList).toContain('badge--pending');

    expect(render('004', 'FINALIZADO').classList).toContain('badge--finished');
    expect(render('005', 'CANCELADO').classList).toContain('badge--cancelled');
  });

  it('un código no contemplado usa el color neutro pero muestra el texto del API', () => {
    const span = render('009', 'REPROCESANDO');
    expect(span.textContent?.trim()).toBe('REPROCESANDO');
    expect(span.classList).toContain('badge--unknown');
  });

  it('si el API no envía el nombre, muestra "Desconocido"', () => {
    expect(render('001', '').textContent?.trim()).toBe('Desconocido');
  });
});
