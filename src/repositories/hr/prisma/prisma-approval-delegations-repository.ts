import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { ApprovalDelegation } from '@/entities/hr/approval-delegation';
import { prisma } from '@/lib/prisma';
import { mapApprovalDelegationPrismaToDomain } from '@/mappers/hr/approval-delegation/approval-delegation-prisma-to-domain';
import type {
  ApprovalDelegationsRepository,
  PaginatedApprovalDelegationsResult,
} from '../approval-delegations-repository';

export class PrismaApprovalDelegationsRepository
  implements ApprovalDelegationsRepository
{
  async create(delegation: ApprovalDelegation): Promise<void> {
    await prisma.approvalDelegation.create({
      data: {
        id: delegation.id.toString(),
        tenantId: delegation.tenantId.toString(),
        delegatorId: delegation.delegatorId.toString(),
        delegateId: delegation.delegateId.toString(),
        scope: delegation.scope,
        startDate: delegation.startDate,
        endDate: delegation.endDate ?? null,
        reason: delegation.reason ?? null,
        isActive: delegation.isActive,
      },
    });
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<ApprovalDelegation | null> {
    const raw = await prisma.approvalDelegation.findFirst({
      where: { id: id.toString(), tenantId },
    });

    if (!raw) return null;

    const domainProps = mapApprovalDelegationPrismaToDomain(
      raw as unknown as Record<string, unknown>,
    );
    return ApprovalDelegation.create(domainProps, new UniqueEntityID(raw.id));
  }

  async findActiveByDelegator(
    delegatorId: UniqueEntityID,
    tenantId: string,
  ): Promise<ApprovalDelegation[]> {
    const rawItems = await prisma.approvalDelegation.findMany({
      where: {
        tenantId,
        delegatorId: delegatorId.toString(),
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return rawItems.map((raw) => {
      const domainProps = mapApprovalDelegationPrismaToDomain(
        raw as unknown as Record<string, unknown>,
      );
      return ApprovalDelegation.create(domainProps, new UniqueEntityID(raw.id));
    });
  }

  async findActiveByDelegate(
    delegateId: UniqueEntityID,
    tenantId: string,
  ): Promise<ApprovalDelegation[]> {
    const rawItems = await prisma.approvalDelegation.findMany({
      where: {
        tenantId,
        delegateId: delegateId.toString(),
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return rawItems.map((raw) => {
      const domainProps = mapApprovalDelegationPrismaToDomain(
        raw as unknown as Record<string, unknown>,
      );
      return ApprovalDelegation.create(domainProps, new UniqueEntityID(raw.id));
    });
  }

  async findManyByDelegator(
    delegatorId: UniqueEntityID,
    tenantId: string,
    skip: number,
    take: number,
  ): Promise<PaginatedApprovalDelegationsResult> {
    const where = {
      tenantId,
      delegatorId: delegatorId.toString(),
    };

    const [rawItems, total] = await Promise.all([
      prisma.approvalDelegation.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          delegator: { select: { id: true, fullName: true } },
          delegate: { select: { id: true, fullName: true } },
        },
      }),
      prisma.approvalDelegation.count({ where }),
    ]);

    const delegations = rawItems.map((raw) => {
      const domainProps = mapApprovalDelegationPrismaToDomain(
        raw as unknown as Record<string, unknown>,
      );
      const delegation = ApprovalDelegation.create(
        domainProps,
        new UniqueEntityID(raw.id),
      );
      // Attach employee names for DTO enrichment
      (delegation as unknown as Record<string, unknown>)._delegatorName =
        raw.delegator?.fullName;
      (delegation as unknown as Record<string, unknown>)._delegateName =
        raw.delegate?.fullName;
      return delegation;
    });

    return { delegations, total };
  }

  async findManyByDelegate(
    delegateId: UniqueEntityID,
    tenantId: string,
    skip: number,
    take: number,
  ): Promise<PaginatedApprovalDelegationsResult> {
    const where = {
      tenantId,
      delegateId: delegateId.toString(),
    };

    const [rawItems, total] = await Promise.all([
      prisma.approvalDelegation.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          delegator: { select: { id: true, fullName: true } },
          delegate: { select: { id: true, fullName: true } },
        },
      }),
      prisma.approvalDelegation.count({ where }),
    ]);

    const delegations = rawItems.map((raw) => {
      const domainProps = mapApprovalDelegationPrismaToDomain(
        raw as unknown as Record<string, unknown>,
      );
      const delegation = ApprovalDelegation.create(
        domainProps,
        new UniqueEntityID(raw.id),
      );
      // Attach employee names for DTO enrichment
      (delegation as unknown as Record<string, unknown>)._delegatorName =
        raw.delegator?.fullName;
      (delegation as unknown as Record<string, unknown>)._delegateName =
        raw.delegate?.fullName;
      return delegation;
    });

    return { delegations, total };
  }

  async findActiveDelegation(
    delegatorId: UniqueEntityID,
    delegateId: UniqueEntityID,
    tenantId: string,
  ): Promise<ApprovalDelegation | null> {
    const raw = await prisma.approvalDelegation.findFirst({
      where: {
        tenantId,
        delegatorId: delegatorId.toString(),
        delegateId: delegateId.toString(),
        isActive: true,
      },
    });

    if (!raw) return null;

    const domainProps = mapApprovalDelegationPrismaToDomain(
      raw as unknown as Record<string, unknown>,
    );
    return ApprovalDelegation.create(domainProps, new UniqueEntityID(raw.id));
  }

  async save(delegation: ApprovalDelegation): Promise<void> {
    await prisma.approvalDelegation.update({
      where: {
        id: delegation.id.toString(),
        tenantId: delegation.tenantId.toString(),
      },
      data: {
        scope: delegation.scope,
        startDate: delegation.startDate,
        endDate: delegation.endDate ?? null,
        reason: delegation.reason ?? null,
        isActive: delegation.isActive,
        updatedAt: delegation.updatedAt,
      },
    });
  }
}
