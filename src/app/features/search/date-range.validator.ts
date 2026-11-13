import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/** Rango máximo de búsqueda permitido, en días. */
export const MAX_RANGE_DAYS = 30;

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/**
 * Valida un grupo con controles `startDate` y `endDate`:
 * - rangeInverted: Inicio es mayor que Término.
 * - rangeTooLong: el rango supera `maxDays` días.
 */
export function dateRangeValidator(maxDays = MAX_RANGE_DAYS): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const start = group.get('startDate')?.value as Date | null;
    const end = group.get('endDate')?.value as Date | null;
    if (!start || !end) {
      return null;
    }
    const days = Math.round((startOfDay(end) - startOfDay(start)) / DAY_MS);
    if (days < 0) {
      return { rangeInverted: true };
    }
    if (days > maxDays) {
      return { rangeTooLong: { maxDays } };
    }
    return null;
  };
}
