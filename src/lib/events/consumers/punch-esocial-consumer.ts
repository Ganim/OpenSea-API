/**
 * Punch → eSocial cache invalidator (Phase 06 / Plan 06-05).
 *
 * Substitui o stub Phase 4. Consumer REAL que mantém um set Redis por
 * tenant/competência com os `employeeId` que tiveram batidas alteradas
 * (criadas ou aprovadas). O `BuildS1200ForCompetenciaUseCase` lê esse set
 * ao disparar a geração mensal — permite identificar quem precisa ser
 * (re)gerado em retificações sem varrer toda a folha.
 *
 * Por que NÃO submetemos S-1200 a cada batida? S-1200 é um evento MENSAL
 * (competência de apuração). Submeter a cada batida seria inválido semanticamente
 * e resultaria em centenas de eventos rejeitados pelo governo.
 *
 * Invariantes:
 *  - Set SADD + EXPIRE é IDEMPOTENTE (set de strings).
 *  - Erros no Redis NÃO propagam — best-effort. Perder uma invalidação apenas
 *    faz o BuildS1200 incluir mais funcionários do que o estritamente necessário
 *    (pior caso: gera S-1200 desnecessariamente para um funcionário já
 *    em dia — aceitável).
 *  - Usamos o `timestamp` da batida (ou `resolvedAt` da aprovação) para
 *    derivar a competência em formato YYYY-MM.
 */

import { redis } from '@/lib/redis';

import type { DomainEvent, EventConsumer } from '../domain-event.interface';
import { PUNCH_EVENTS } from '../punch-events';

// Lazy logger (Plan 04-05 pattern — evita @env init em unit specs).
let _logger: {
  debug?: (obj: unknown, msg: string) => void;
  info: (obj: unknown, msg: string) => void;
  error: (obj: unknown, msg: string) => void;
} | null = null;
function getLogger() {
  if (!_logger) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      _logger = require('@/lib/logger').logger;
    } catch {
      _logger = {
        info: (obj, msg) => console.log(msg, obj),
        error: (obj, msg) => console.error(msg, obj),
      };
    }
  }
  return _logger!;
}

const TTL_SECONDS_90_DAYS = 60 * 60 * 24 * 90;

function extractInvalidationInputs(
  event: DomainEvent,
): { employeeId: string; competencia: string } | null {
  const data = event.data as Record<string, unknown>;

  const employeeId =
    typeof data.employeeId === 'string' ? data.employeeId : undefined;

  // Source of truth: prefer `timestamp` (TIME_ENTRY_CREATED) ou `resolvedAt`
  // (APPROVAL_RESOLVED); ambos são ISO-8601 e fatiam em YYYY-MM diretamente.
  const ts =
    typeof data.timestamp === 'string'
      ? data.timestamp
      : typeof data.resolvedAt === 'string'
        ? data.resolvedAt
        : undefined;

  if (!employeeId || !ts) return null;
  if (ts.length < 7) return null; // YYYY-MM minimum

  const competencia = ts.slice(0, 7);
  // Sanity: must match YYYY-MM format.
  if (!/^\d{4}-\d{2}$/.test(competencia)) return null;

  return { employeeId, competencia };
}

export const punchEsocialConsumer: EventConsumer = {
  consumerId: 'compliance.s1200-cache-invalidator',
  moduleId: 'compliance',
  subscribesTo: [
    PUNCH_EVENTS.TIME_ENTRY_CREATED,
    PUNCH_EVENTS.APPROVAL_RESOLVED,
  ],

  async handle(event: DomainEvent): Promise<void> {
    if (!event.tenantId) return;

    const extracted = extractInvalidationInputs(event);
    if (!extracted) return;

    const { employeeId, competencia } = extracted;
    const key = `esocial:s1200:${event.tenantId}:${competencia}:touched`;

    try {
      await redis.client.sadd(key, employeeId);
      await redis.client.expire(key, TTL_SECONDS_90_DAYS);

      getLogger().debug?.(
        { tenantId: event.tenantId, competencia, employeeId },
        '[punch-esocial-consumer] marked touched',
      );
    } catch (err) {
      // Best-effort — erro no Redis não bloqueia o evento.
      getLogger().error(
        {
          err,
          key,
          tenantId: event.tenantId,
          competencia,
          employeeId,
        },
        '[punch-esocial-consumer] redis error (non-fatal)',
      );
    }
  },
};
