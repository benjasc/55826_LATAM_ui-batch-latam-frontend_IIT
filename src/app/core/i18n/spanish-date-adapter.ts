import { Injectable, Provider } from '@angular/core';
import {
  DateAdapter,
  MAT_DATE_FORMATS,
  MAT_DATE_LOCALE,
  MAT_NATIVE_DATE_FORMATS,
  NativeDateAdapter,
} from '@angular/material/core';

/**
 * Adaptador de fechas que entiende el formato dd/MM/yyyy al escribir la fecha a mano.
 * (El adaptador nativo usa Date.parse, que interpreta mal "29/6/2023").
 */
@Injectable()
export class SpanishDateAdapter extends NativeDateAdapter {
  override parse(value: unknown, parseFormat?: unknown): Date | null {
    if (typeof value === 'string') {
      const text = value.trim();
      if (!text) {
        return null;
      }
      const match = text.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
      if (!match) {
        return this.invalid();
      }
      const [day, month, year] = [Number(match[1]), Number(match[2]), Number(match[3])];
      const date = new Date(year, month - 1, day);
      const exists = date.getDate() === day && date.getMonth() === month - 1;
      return exists ? date : this.invalid();
    }
    return super.parse(value, parseFormat);
  }

  /** La semana comienza el lunes. */
  override getFirstDayOfWeek(): number {
    return 1;
  }
}

/** Calendarios (mat-datepicker) en español con formato dd/MM/yyyy. */
export function provideSpanishDates(): Provider[] {
  return [
    { provide: MAT_DATE_LOCALE, useValue: 'es' },
    { provide: DateAdapter, useClass: SpanishDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: MAT_NATIVE_DATE_FORMATS },
  ];
}
