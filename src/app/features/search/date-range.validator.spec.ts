import { FormControl, FormGroup } from '@angular/forms';

import { dateRangeValidator } from './date-range.validator';

function group(start: Date | null, end: Date | null) {
  return new FormGroup(
    { startDate: new FormControl(start), endDate: new FormControl(end) },
    { validators: dateRangeValidator(30) },
  );
}

describe('dateRangeValidator', () => {
  it('no valida mientras falte alguna fecha', () => {
    expect(group(null, new Date()).errors).toBeNull();
  });

  it('acepta el mismo día y hasta 30 días', () => {
    expect(group(new Date(2026, 0, 1), new Date(2026, 0, 1)).errors).toBeNull();
    expect(group(new Date(2026, 0, 1), new Date(2026, 0, 31)).errors).toBeNull();
  });

  it('rechaza más de 30 días', () => {
    expect(group(new Date(2026, 0, 1), new Date(2026, 1, 1)).errors).toEqual({ rangeTooLong: { maxDays: 30 } });
  });

  it('rechaza inicio mayor a término', () => {
    expect(group(new Date(2026, 0, 10), new Date(2026, 0, 9)).errors).toEqual({ rangeInverted: true });
  });
});
