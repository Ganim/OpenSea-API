import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
  PunchApproval,
  PunchApprovalReason,
  PunchApprovalStatus,
} from '@/entities/hr/punch-approval';

/**
 * Filtros opcionais para listagem paginada de PunchApprovals.
 *
 * Defaults aplicados pela implementação quando não fornecidos:
 * - `page = 1`
 * - `pageSize = 20` (máximo 100, enforçado pelo schema Zod no controller)
 */
export interface FindManyPunchApprovalsFilters {
  status?: PunchApprovalStatus;
  reason?: PunchApprovalReason;
  employeeId?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Contrato para persistência de PunchApproval.
 *
 * - `create`: usado por Plan 4 `ExecutePunchUseCase` quando
 *   `GeofenceValidator` retorna `APPROVAL_REQUIRED` (D-12).
 * - `save`: usado pelo `ResolvePunchApprovalUseCase` após transição.
 * - `findByTimeEntryId`: garante a relação 1:1 com `TimeEntry` — Plan 4
 *   consulta antes de criar para idempotência.
 * - `findManyByTenantId`: usado por `ListPunchApprovalsUseCase` (gestor).
 */
export interface PunchApprovalsRepository {
  create(approval: PunchApproval): Promise<void>;
  save(approval: PunchApproval): Promise<void>;
  findById(id: UniqueEntityID, tenantId: string): Promise<PunchApproval | null>;
  findByTimeEntryId(
    timeEntryId: UniqueEntityID,
    tenantId: string,
  ): Promise<PunchApproval | null>;
  findManyByTenantId(
    tenantId: string,
    filters?: FindManyPunchApprovalsFilters,
  ): Promise<{ items: PunchApproval[]; total: number }>;

  /**
   * Phase 8 / Plan 08-01 — D-08 anti-spam.
   *
   * Conta quantas `PunchApproval` o funcionário tem no `status` informado
   * dentro do tenant. Usado pelo `CreateSelfPunchApprovalUseCase` para
   * limitar a 5 PENDING simultâneas (acima disso retorna 429).
   */
  countByEmployeeAndStatus(
    employeeId: string,
    status: PunchApprovalStatus,
    tenantId: string,
  ): Promise<number>;
}
