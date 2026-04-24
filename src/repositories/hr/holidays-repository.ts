/**
 * Phase 07 / Plan 07-05a — HolidaysRepository.
 *
 * Representa feriados tenant-wide que dispensam o funcionário de bater ponto
 * naquela data. Consumido pelo `DetectMissedPunchesUseCase` para skipar dias
 * em que NINGUÉM do tenant tinha expectativa de trabalhar.
 *
 * **Deviation (Rule 3 — blocker auto-fix):** o projeto NÃO tem um model
 * `Holiday` no schema Prisma — apenas o enum value `HOLIDAY` em `PayrollItemType`
 * e `EventType` (calendário). O plan 07-05a assume a existência de um model.
 * Em vez de adicionar uma migration nova (o que seria phase-level deviation),
 * reutilizamos o utilitário `brazilian-holidays.ts` que já calcula os 11
 * feriados nacionais brasileiros in-memory (Meeus/Jones/Butcher para Páscoa).
 *
 * A implementação "Prisma" deste repo é na verdade uma implementação
 * determinística: para qualquer tenant brasileiro, retorna o feriado
 * nacional da data se houver. Feriados municipais/estaduais específicos
 * por tenant ficam para fase futura (quando o cliente requisitar).
 *
 * O shape `HolidayInfo` é o retorno mínimo necessário para o scheduler
 * skipar a data — não precisamos de entity de domínio pois não há persistência.
 */
export interface HolidayInfo {
  /** Data do feriado (start-of-day UTC para o ano referente). */
  date: Date;
  /** Nome em português formal (ex.: "Tiradentes"). */
  name: string;
  /** Escopo do feriado: nacional (todos os tenants) ou tenant-specific (reservado). */
  scope: 'NATIONAL' | 'TENANT';
}

export interface HolidaysRepository {
  /**
   * Retorna o feriado tenant-wide que cobre exatamente `date` (comparação por
   * dia — ignora horas/minutos). Null quando não há feriado na data.
   *
   * **Semântica:** um feriado "cobre" a data quando `date.getFullYear()` +
   * `date.getMonth()` + `date.getDate()` coincide com os mesmos campos de
   * algum feriado retornado por `getBrazilianHolidays(year)`.
   */
  findOnDate(tenantId: string, date: Date): Promise<HolidayInfo | null>;
}
