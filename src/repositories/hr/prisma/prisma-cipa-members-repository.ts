import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { CipaMember } from '@/entities/hr/cipa-member';
import { prisma } from '@/lib/prisma';
import { mapCipaMemberPrismaToDomain } from '@/mappers/hr/cipa-member';
import type {
  CipaMembersRepository,
  CreateCipaMemberSchema,
  FindCipaMemberFilters,
} from '../cipa-members-repository';

export class PrismaCipaMembersRepository implements CipaMembersRepository {
  async create(data: CreateCipaMemberSchema): Promise<CipaMember> {
    const record = await prisma.cipaMember.create({
      data: {
        tenantId: data.tenantId,
        mandateId: data.mandateId.toString(),
        employeeId: data.employeeId.toString(),
        role: data.role,
        type: data.type,
        isStable: data.isStable ?? false,
        stableUntil: data.stableUntil,
      },
    });

    return CipaMember.create(
      mapCipaMemberPrismaToDomain(record),
      new UniqueEntityID(record.id),
    );
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<CipaMember | null> {
    const record = await prisma.cipaMember.findFirst({
      where: { id: id.toString(), tenantId },
    });

    if (!record) return null;

    return CipaMember.create(
      mapCipaMemberPrismaToDomain(record),
      new UniqueEntityID(record.id),
    );
  }

  async findByMandateAndEmployee(
    mandateId: UniqueEntityID,
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<CipaMember | null> {
    const record = await prisma.cipaMember.findFirst({
      where: {
        mandateId: mandateId.toString(),
        employeeId: employeeId.toString(),
        tenantId,
      },
    });

    if (!record) return null;

    return CipaMember.create(
      mapCipaMemberPrismaToDomain(record),
      new UniqueEntityID(record.id),
    );
  }

  async findMany(
    tenantId: string,
    filters?: FindCipaMemberFilters,
  ): Promise<CipaMember[]> {
    const page = filters?.page ?? 1;
    const perPage = Math.min(filters?.perPage ?? 50, 100);
    const skip = (page - 1) * perPage;

    const records = await prisma.cipaMember.findMany({
      where: {
        tenantId,
        mandateId: filters?.mandateId?.toString(),
        employeeId: filters?.employeeId?.toString(),
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: perPage,
    });

    return records.map((record) =>
      CipaMember.create(
        mapCipaMemberPrismaToDomain(record),
        new UniqueEntityID(record.id),
      ),
    );
  }

  async findActiveByEmployeeId(
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<CipaMember[]> {
    const now = new Date();

    const records = await prisma.cipaMember.findMany({
      where: {
        tenantId,
        employeeId: employeeId.toString(),
        isStable: true,
        stableUntil: { gt: now },
      },
    });

    return records.map((record) =>
      CipaMember.create(
        mapCipaMemberPrismaToDomain(record),
        new UniqueEntityID(record.id),
      ),
    );
  }

  async delete(id: UniqueEntityID): Promise<void> {
    await prisma.cipaMember.delete({
      where: { id: id.toString() },
    });
  }
}
