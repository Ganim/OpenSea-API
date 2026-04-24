import type {
  PunchApprovalReason,
  PunchApprovalStatus,
} from '@/entities/hr/punch-approval';
import {
  type PunchApprovalDTO,
  punchApprovalToDTO,
} from '@/mappers/hr/punch-approval/punch-approval-to-dto';
import type { PunchApprovalsRepository } from '@/repositories/hr/punch-approvals-repository';

export interface ListPunchApprovalsRequest {
  tenantId: string;
  status?: PunchApprovalStatus;
  reason?: PunchApprovalReason;
  employeeId?: string;
  page?: number;
  pageSize?: number;
}

export interface ListPunchApprovalsResponse {
  items: PunchApprovalDTO[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Lista paginada de PunchApprovals do tenant. Usa `punchApprovalToDTO`
 * para normalizar datas e preservar `details` como JSON.
 *
 * Controle de acesso "funcionário só vê suas próprias aprovações" é
 * feito no controller — quando o caller não tem `hr.punch-approvals.admin`,
 * o controller força `employeeId = userEmployeeId` (T-04-15).
 */
export class ListPunchApprovalsUseCase {
  constructor(private punchApprovalsRepository: PunchApprovalsRepository) {}

  async execute(
    input: ListPunchApprovalsRequest,
  ): Promise<ListPunchApprovalsResponse> {
    const page = input.page ?? 1;
    const pageSize = input.pageSize ?? 20;

    const { items, total } =
      await this.punchApprovalsRepository.findManyByTenantId(input.tenantId, {
        status: input.status,
        reason: input.reason,
        employeeId: input.employeeId,
        page,
        pageSize,
      });

    return {
      // Wrap in arrow so Array.map não passe index como 2º arg do mapper
      // (o mapper tem `linkedRequest?` como 2º param — sem wrapper, o index
      // numérico seria coerced para o campo e a Zod response falha).
      items: items.map((approval) => punchApprovalToDTO(approval)),
      total,
      page,
      pageSize,
    };
  }
}
