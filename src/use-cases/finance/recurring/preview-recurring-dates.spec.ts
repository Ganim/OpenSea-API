import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { beforeEach, describe, expect, it } from 'vitest';

import { PreviewRecurringDatesUseCase } from './preview-recurring-dates';

let sut: PreviewRecurringDatesUseCase;

describe('PreviewRecurringDatesUseCase', () => {
  beforeEach(() => {
    sut = new PreviewRecurringDatesUseCase();
  });

  it('should generate monthly dates from start date', async () => {
    const response = await sut.execute({
      startDate: new Date(2026, 0, 15), // Jan 15
      frequency: 'MONTHLY',
      count: 3,
    });

    expect(response.dates).toHaveLength(3);
    expect(response.dates[0].date).toBe('2026-01-15');
    expect(response.dates[1].date).toBe('2026-02-15');
    expect(response.dates[2].date).toBe('2026-03-15');
  });

  it('should generate weekly dates', async () => {
    const response = await sut.execute({
      startDate: new Date(2026, 2, 2), // Mon Mar 2
      frequency: 'WEEKLY',
      count: 4,
    });

    expect(response.dates).toHaveLength(4);
  });

  it('should generate annual dates', async () => {
    const response = await sut.execute({
      startDate: new Date(2026, 5, 1), // Jun 1
      frequency: 'ANNUAL',
      count: 3,
    });

    expect(response.dates).toHaveLength(3);
    expect(response.dates[0].date).toBe('2026-06-01');
    expect(response.dates[1].date).toBe('2027-06-01');
    expect(response.dates[2].date).toBe('2028-06-01');
  });

  it('should mark weekends correctly', async () => {
    // Saturday, Jan 3, 2026
    const response = await sut.execute({
      startDate: new Date(2026, 0, 3),
      frequency: 'DAILY',
      count: 3,
    });

    expect(response.dates[0].isWeekend).toBe(true); // Sat
    expect(response.dates[1].isWeekend).toBe(true); // Sun
    expect(response.dates[2].isWeekend).toBe(false); // Mon
  });

  it('should mark Brazilian holidays correctly', async () => {
    const response = await sut.execute({
      startDate: new Date(2026, 11, 25), // Dec 25 - Natal
      frequency: 'MONTHLY',
      count: 1,
    });

    expect(response.dates[0].isHoliday).toBe(true);
    expect(response.dates[0].holidayName).toBe('Natal');
  });

  it('should adjust weekends to next Monday when skipWeekends is true', async () => {
    // Saturday, Jan 3, 2026
    const response = await sut.execute({
      startDate: new Date(2026, 0, 3),
      frequency: 'MONTHLY',
      count: 1,
      skipWeekends: true,
    });

    expect(response.dates[0].isWeekend).toBe(true);
    expect(response.dates[0].adjustedDate).toBe('2026-01-05'); // Monday
  });

  it('should adjust holidays to next business day when skipHolidays is true', async () => {
    // Jan 1 2026 is a Thursday (Confraternização Universal)
    const response = await sut.execute({
      startDate: new Date(2026, 0, 1),
      frequency: 'MONTHLY',
      count: 1,
      skipHolidays: true,
    });

    expect(response.dates[0].isHoliday).toBe(true);
    expect(response.dates[0].adjustedDate).toBeDefined();
  });

  it('should default to 12 dates when count is not specified', async () => {
    const response = await sut.execute({
      startDate: new Date(2026, 0, 1),
      frequency: 'MONTHLY',
    });

    expect(response.dates).toHaveLength(12);
  });

  it('should throw when count is less than 1', async () => {
    await expect(
      sut.execute({
        startDate: new Date(2026, 0, 1),
        frequency: 'MONTHLY',
        count: 0,
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should throw when count exceeds 60', async () => {
    await expect(
      sut.execute({
        startDate: new Date(2026, 0, 1),
        frequency: 'MONTHLY',
        count: 61,
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should not adjust dates when both skip flags are false', async () => {
    // Saturday
    const response = await sut.execute({
      startDate: new Date(2026, 0, 3),
      frequency: 'MONTHLY',
      count: 1,
      skipWeekends: false,
      skipHolidays: false,
    });

    expect(response.dates[0].isWeekend).toBe(true);
    expect(response.dates[0].adjustedDate).toBeUndefined();
  });
});
