import { getBrazilianHolidays } from '@/utils/brazilian-holidays';

import type { HolidayInfo, HolidaysRepository } from '../holidays-repository';

/**
 * Implementação "Prisma" do HolidaysRepository (Phase 07 / Plan 07-05a).
 *
 * **Sem DB — fonte determinística.** O projeto não tem model `Holiday` no
 * schema Prisma (apenas o enum value `HOLIDAY` em PayrollItemType/EventType).
 * Em vez de adicionar migration + model nesta fase (phase-level deviation),
 * esta implementação usa `getBrazilianHolidays(year)` (8 fixos + 3 móveis
 * derivados da Páscoa via Meeus/Jones/Butcher).
 *
 * Para cada chamada, calcula os 11 feriados nacionais do ano de `date` e
 * retorna o que bate por (year, month, day). Se nenhum bate, null.
 *
 * **Evolução futura:** quando o cliente precisar de feriados municipais/
 * estaduais por tenant, substituir esta classe por uma implementação que
 * consulte uma tabela `Holiday` (migration + model) e **mantenha fallback**
 * para os nacionais via `getBrazilianHolidays` (padrão defense-in-depth).
 */
export class PrismaHolidaysRepository implements HolidaysRepository {
  async findOnDate(_tenantId: string, date: Date): Promise<HolidayInfo | null> {
    const year = date.getFullYear();
    const target = {
      y: date.getFullYear(),
      m: date.getMonth(),
      d: date.getDate(),
    };

    const holidays = getBrazilianHolidays(year);
    const match = holidays.find(
      (h) =>
        h.date.getFullYear() === target.y &&
        h.date.getMonth() === target.m &&
        h.date.getDate() === target.d,
    );

    if (!match) return null;

    return {
      date: match.date,
      name: match.name,
      scope: 'NATIONAL',
    };
  }
}
