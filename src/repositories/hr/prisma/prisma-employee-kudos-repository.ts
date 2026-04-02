import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { EmployeeKudos } from '@/entities/hr/employee-kudos';
import { prisma } from '@/lib/prisma';
import { mapEmployeeKudosPrismaToDomain } from '@/mappers/hr/employee-kudos';
import type {
  EmployeeKudosRepository,
  PaginatedKudosResult,
} from '../employee-kudos-repository';

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

    const kudos = rawItems.map((raw) => {
      const domainProps = mapEmployeeKudosPrismaToDomain(
        raw as unknown as Record<string, unknown>,
      );
      return EmployeeKudos.create(domainProps, new UniqueEntityID(raw.id));
    });

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

    const kudos = rawItems.map((raw) => {
      const domainProps = mapEmployeeKudosPrismaToDomain(
        raw as unknown as Record<string, unknown>,
      );
      return EmployeeKudos.create(domainProps, new UniqueEntityID(raw.id));
    });

    return { kudos, total };
  }

  async findManyPublicFeed(
    tenantId: string,
    skip: number,
    take: number,
  ): Promise<PaginatedKudosResult> {
    const where = {
      tenantId,
      isPublic: true,
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

    const kudos = rawItems.map((raw) => {
      const domainProps = mapEmployeeKudosPrismaToDomain(
        raw as unknown as Record<string, unknown>,
      );
      return EmployeeKudos.create(domainProps, new UniqueEntityID(raw.id));
    });

    return { kudos, total };
  }
}
