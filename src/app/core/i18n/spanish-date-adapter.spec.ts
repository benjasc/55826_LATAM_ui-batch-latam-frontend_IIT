import { TestBed } from '@angular/core/testing';
import { DateAdapter } from '@angular/material/core';

import { provideSpanishDates } from './spanish-date-adapter';

describe('SpanishDateAdapter', () => {
  let adapter: DateAdapter<Date>;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideSpanishDates()] });
    adapter = TestBed.inject(DateAdapter);
  });

  it('interpreta dd/MM/yyyy', () => {
    expect(adapter.parse('29/6/2023', null)).toEqual(new Date(2023, 5, 29));
    expect(adapter.parse('04-07-2023', null)).toEqual(new Date(2023, 6, 4));
  });

  it('rechaza fechas inexistentes o con otro formato', () => {
    expect(adapter.isValid(adapter.parse('31/02/2023', null)!)).toBeFalse();
    expect(adapter.isValid(adapter.parse('2023-06-29', null)!)).toBeFalse();
  });

  it('texto vacío = sin fecha', () => {
    expect(adapter.parse('  ', null)).toBeNull();
  });
});
