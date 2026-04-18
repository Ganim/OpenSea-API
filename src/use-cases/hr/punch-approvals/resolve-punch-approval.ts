import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PunchApprovalsRepository } from '@/repositories/hr/punch-approvals-repository';

export type ResolveDecision = 'APPROVE' | 'REJECT';

export interface ResolvePunchApprovalRequest {
  tenantId: string;
  approvalId: string;
  decision: ResolveDecision;
  resolverUserId: string;
  note?: string;
}

export interface ResolvePunchApprovalResponse {
  approvalId: string;
  status: 'APPROVED' | 'REJECTED';
  resolvedAt: string;
}

/**
 * Gestor resolve (aprovar ou rejeitar) uma PunchApproval PENDING.
 *
 * Flow:
 *   findById → validate decision → delegate state transition para a entity
 *   → repo.save → retorna DTO leve com status + resolvedAt ISO.
 *
 * Double-resolve: a entity lança `Error`; este use case traduz para
 * `BadRequestError` para o controller mapear como 400.
 */
export class ResolvePunchApprovalUseCase {
  constructor(private punchApprovalsRepository: PunchApprovalsRepository) {}

  async execute(
    input: ResolvePunchApprovalRequest,
  ): Promise<ResolvePunchApprovalResponse> {
    if (input.decision !== 'APPROVE' && input.decision !== 'REJECT') {
      throw new BadRequestError('decision deve ser APPROVE ou REJECT');
    }

    const approval = await this.punchApprovalsRepository.findById(
      new UniqueEntityID(input.approvalId),
      input.tenantId,
    );

    if (!approval) {
      throw new ResourceNotFoundError('Aprovação não encontrada');
    }

    try {
      if (input.decision === 'APPROVE') {
        approval.resolve(input.resolverUserId, input.note);
      } else {
        approval.reject(input.resolverUserId, input.note);
      }
    } catch (err) {
      throw new BadRequestError(
        err instanceof Error ? err.message : 'Erro ao resolver aprovação',
      );
    }

    await this.punchApprovalsRepository.save(approval);

    return {
      approvalId: approval.id.toString(),
      status: approval.status as 'APPROVED' | 'REJECTED',
      // resolvedAt é garantido aqui — setado por resolve/reject imediatamente antes.
      resolvedAt: approval.resolvedAt!.toISOString(),
    };
  }
}
