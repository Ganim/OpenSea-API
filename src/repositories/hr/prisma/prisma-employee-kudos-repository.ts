import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { EmployeeKudos } from '@/entities/hr/employee-kudos';
import { prisma } from '@/lib/prisma';
import { mapEmployeeKudosPrismaToDomain } from '@/mappers/hr/employee-kudos';
import type {
  EmployeeKudosRepository,
  ListPublicKudosFeedFilters,
  PaginatedKudosResult,
} from '../employee-kudos-repository';

function buildKudosFromRaw(raw: Record<string, unknown>): EmployeeKudos {
  const domainProps = mapEmployeeKudosPrismaToDomain(raw);
  return EmployeeKudos.create(
    domainProps,
    new UniqueEntityID(raw.id as string),
  );
}

export class PrismaEmployeeKudosRepository implements EmployeeKudosRepository {
  async create(kudos: EmployeeKudos): Promise<void> {
    await prisma.employeeKudos.create({
      data: {
        id: kudos.id.toString(),
        tenantId: kudos.tenantId.toString(),
        fromEmployeeId: kudos.fromEmployeeId.toString(),
        toEmployeeId: kudos.toEmployeeId.toString(),
        message: kudos.message,
        category: kudos.category,
        isPublic: kudos.isPublic,
        isPinned: kudos.isPinned,
        pinnedAt: kudos.pinnedAt ?? null,
        pinnedBy: kudos.pinnedBy ? kudos.pinnedBy.toString() : null,
      },
    });
  }

  async findById(
    kudosId: UniqueEntityID,
    tenantId: string,
  ): Promise<EmployeeKudos | null> {
    const raw = await prisma.employeeKudos.findFirst({
      where: { id: kudosId.toString(), tenantId },
    });

    if (!raw) return null;
    return buildKudosFromRaw(raw as unknown as Record<string, unknown>);
  }

  async save(kudos: EmployeeKudos): Promise<void> {
    await prisma.employeeKudos.update({
      where: { id: kudos.id.toString(), tenantId: kudos.tenantId.toString() },
      data: {
        message: kudos.message,
        category: kudos.category,
        isPublic: kudos.isPublic,
        isPinned: kudos.isPinned,
        pinnedAt: kudos.pinnedAt ?? null,
        pinnedBy: kudos.pinnedBy ? kudos.pinnedBy.toString() : null,
      },
    });
  }

  async findManyByRecipient(
    toEmployeeId: UniqueEntityID,
    tenantId: string,
    skip: number,
    take: number,
  ): Promise<PaginatedKudosResult> {
    const where = {
      tenantId,
      toEmployeeId: toEmployeeId.toString(),
    };

    const [rawItems, total] = await Promise.all([
      prisma.employeeKudos.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.employeeKudos.count({ where }),
    ]);

    const kudos = rawItems.map((raw) =>
      buildKudosFromRaw(raw as unknown as Record<string, unknown>),
    );

    return { kudos, total };
  }

  async findManyBySender(
    fromEmployeeId: UniqueEntityID,
    tenantId: string,
    skip: number,
    take: number,
  ): Promise<PaginatedKudosResult> {
    const where = {
      tenantId,
      fromEmployeeId: fromEmployeeId.toString(),
    };

    const [rawItems, total] = await Promise.all([
      prisma.employeeKudos.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.employeeKudos.count({ where }),
    ]);

    const kudos = rawItems.map((raw) =>
      buildKudosFromRaw(raw as unknown as Record<string, unknown>),
    );

    return { kudos, total };
  }

  async findManyPublicFeed(
    tenantId: string,
    skip: number,
    take: number,
    filters?: ListPublicKudosFeedFilters,
  ): Promise<PaginatedKudosResult> {
    const where: Record<string, unknown> = {
      tenantId,
      isPublic: true,
    };

    if (filters?.pinned !== undefined) {
      where.isPinned = filters.pinned;
    }

    const [rawItems, total] = await Promise.all([
      prisma.employeeKudos.findMany({
        where,
        skip,
        take,
        orderBy: [
          { isPinned: 'desc' },
          { pinnedAt: 'desc' },
          { createdAt: 'desc' },
        ],
      }),
      prisma.employeeKudos.count({ where }),
    ]);

    const kudos = rawItems.map((raw) =>
      buildKudosFromRaw(raw as unknown as Record<string, unknown>),
    );

    return { kudos, total };
  }
}
