import { getTypedEventBus } from '@/lib/events';
import { PrismaPunchApprovalsRepository } from '@/repositories/hr/prisma/prisma-punch-approvals-repository';
import { PrismaTimeEntriesRepository } from '@/repositories/hr/prisma/prisma-time-entries-repository';
import { ResolvePunchApprovalUseCase } from '../resolve-punch-approval';

/**
 * Phase 06 / Plan 06-02 — factory que habilita o fluxo de correção
 * (`correctionPayload`) em `ResolvePunchApprovalUseCase`.
 *
 * Difere do `make-resolve-punch-approval-use-case` (Phase 04-03) por injetar
 * também `TimeEntriesRepository` (necessário para `createAdjustment`) e o
 * `TypedEventBus` (para emitir `PUNCH_EVENTS.TIME_ENTRY_CREATED` da nova
 * batida corrigida + `PUNCH_EVENTS.APPROVAL_RESOLVED`).
 *
 * O factory antigo continua existindo para preservar call sites legados que
 * NÃO querem expor o fluxo de correção (controller HTTP atual de resolve).
 * O controller de resolve com correção (a ser criado em Plan 06-04 quando
 * o flow do gestor RH ganhar UI dedicada) deve usar este factory.
 */
export function makeResolvePunchApprovalWithCorrectionUseCase() {
  return new ResolvePunchApprovalUseCase(
    new PrismaPunchApprovalsRepository(),
    new PrismaTimeEntriesRepository(),
    getTypedEventBus(),
  );
}
