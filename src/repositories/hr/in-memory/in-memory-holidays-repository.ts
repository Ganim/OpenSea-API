import type { HolidayInfo, HolidaysRepository } from '../holidays-repository';

/**
 * In-memory implementation do HolidaysRepository (Phase 07 / Plan 07-05a).
 *
 * Specs seedam entradas via `addHoliday(tenantId, date, name)` e validam o
 * shortcut `findOnDate` — comparação por year+month+day, ignora horas.
 */
export class InMemoryHolidaysRepository implements HolidaysRepository {
  public items: Array<HolidayInfo & { tenantId: string }> = [];

  addHoliday(tenantId: string, date: Date, name: string) {
    this.items.push({ tenantId, date, name, scope: 'TENANT' });
  }

  async findOnDate(tenantId: string, date: Date): Promise<HolidayInfo | null> {
    const y = date.getUTCFullYear();
    const m = date.getUTCMonth();
    const d = date.getUTCDate();
    const match = this.items.find(
      (h) =>
        h.tenantId === tenantId &&
        h.date.getUTCFullYear() === y &&
        h.date.getUTCMonth() === m &&
        h.date.getUTCDate() === d,
    );
    return match
      ? { date: match.date, name: match.name, scope: match.scope }
      : null;
  }
}
