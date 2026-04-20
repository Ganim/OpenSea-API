import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PunchApproval } from '@/entities/hr/punch-approval';
import { prisma } from '@/lib/prisma';
import { punchApprovalPrismaToDomain } from '@/mappers/hr/punch-approval/punch-approval-prisma-to-domain';
import type {
  Prisma,
  PunchApprovalReason as PrismaPunchApprovalReason,
  PunchApprovalStatus as PrismaPunchApprovalStatus,
} from '@prisma/generated/client.js';
import type {
  FindManyPunchApprovalsFilters,
  PunchApprovalsRepository,
} from '../punch-approvals-repository';

/**
 * Implementação Prisma do PunchApprovalsRepository.
 *
 * Multi-tenant: toda query filtra por `tenantId` no `where`.
 * PunchApproval não tem `deletedAt` (lifecycle é PENDING → APPROVED/REJECTED;
 * remoção não faz sentido — registro é preservado para audit Portaria 671).
 *
 * Plan 4 `ExecutePunchUseCase` chama `create` dentro da mesma transação
 * da gravação do `TimeEntry` quando `GeofenceValidator` retorna
 * `APPROVAL_REQUIRED` (D-12).
 */
export class PrismaPunchApprovalsRepository
  implements PunchApprovalsRepository
{
  async create(approval: PunchApproval): Promise<void> {
    await prisma.punchApproval.create({
      data: {
        id: approval.id.toString(),
        tenantId: approval.tenantId.toString(),
        timeEntryId: approval.timeEntryId.toString(),
        employeeId: approval.employeeId.toString(),
        reason: approval.reason as PrismaPunchApprovalReason,
        details:
          (approval.details as Prisma.InputJsonValue | undefined) ?? undefined,
        status: approval.status as PrismaPunchApprovalStatus,
        resolverUserId: approval.resolverUserId?.toString() ?? null,
        resolvedAt: approval.resolvedAt ?? null,
        resolverNote: approval.resolverNote ?? null,
      },
    });
  }

  async save(approval: PunchApproval): Promise<void> {
    await prisma.punchApproval.update({
      where: { id: approval.id.toString() },
      data: {
        status: approval.status as PrismaPunchApprovalStatus,
        resolverUserId: approval.resolverUserId?.toString() ?? null,
        resolvedAt: approval.resolvedAt ?? null,
        resolverNote: approval.resolverNote ?? null,
        // Phase 06 / Plan 06-02: persistir mutações no `details` (ex:
        // `correctionNsr` setado por `mergeDetails` quando o gestor aprova
        // com `correctionPayload`). Antes de Phase 6 esta coluna era write-once
        // (set apenas no `create`) — agora é read-write.
        details:
          approval.details === undefined
            ? undefined
            : (approval.details as Prisma.InputJsonValue),
      },
    });
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<PunchApproval | null> {
    const raw = await prisma.punchApproval.findFirst({
      where: {
        id: id.toString(),
        tenantId,
      },
    });

    return raw ? punchApprovalPrismaToDomain(raw) : null;
  }

  async findByTimeEntryId(
    timeEntryId: UniqueEntityID,
    tenantId: string,
  ): Promise<PunchApproval | null> {
    const raw = await prisma.punchApproval.findFirst({
      where: {
        timeEntryId: timeEntryId.toString(),
        tenantId,
      },
    });

    return raw ? punchApprovalPrismaToDomain(raw) : null;
  }

  async findManyByTenantId(
    tenantId: string,
    filters: FindManyPunchApprovalsFilters = {},
  ): Promise<{ items: PunchApproval[]; total: number }> {
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 20;

    const where: Prisma.PunchApprovalWhereInput = {
      tenantId,
      ...(filters.status
        ? { status: filters.status as PrismaPunchApprovalStatus }
        : {}),
      ...(filters.reason
        ? { reason: filters.reason as PrismaPunchApprovalReason }
        : {}),
      ...(filters.employeeId ? { employeeId: filters.employeeId } : {}),
    };

    const [rows, total] = await Promise.all([
      prisma.punchApproval.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.punchApproval.count({ where }),
    ]);

    return { items: rows.map(punchApprovalPrismaToDomain), total };
  }
}
