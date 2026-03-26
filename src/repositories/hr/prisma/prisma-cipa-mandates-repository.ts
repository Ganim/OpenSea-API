import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { CipaMandate } from '@/entities/hr/cipa-mandate';
import { prisma } from '@/lib/prisma';
import { mapCipaMandatePrismaToDomain } from '@/mappers/hr/cipa-mandate';
import type {
  CipaMandatesRepository,
  CreateCipaMandateSchema,
  FindCipaMandateFilters,
  UpdateCipaMandateSchema,
} from '../cipa-mandates-repository';

export class PrismaCipaMandatesRepository implements CipaMandatesRepository {
  async create(data: CreateCipaMandateSchema): Promise<CipaMandate> {
    const record = await prisma.cipaMandate.create({
      data: {
        tenantId: data.tenantId,
        name: data.name,
        startDate: data.startDate,
        endDate: data.endDate,
        status: data.status ?? 'ACTIVE',
        electionDate: data.electionDate,
        notes: data.notes,
      },
    });

    return CipaMandate.create(
      mapCipaMandatePrismaToDomain(record),
      new UniqueEntityID(record.id),
    );
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<CipaMandate | null> {
    const record = await prisma.cipaMandate.findFirst({
      where: { id: id.toString(), tenantId },
    });

    if (!record) return null;

    return CipaMandate.create(
      mapCipaMandatePrismaToDomain(record),
      new UniqueEntityID(record.id),
    );
  }

  async findMany(
    tenantId: string,
    filters?: FindCipaMandateFilters,
  ): Promise<CipaMandate[]> {
    const page = filters?.page ?? 1;
    const perPage = Math.min(filters?.perPage ?? 50, 100);
    const skip = (page - 1) * perPage;

    const records = await prisma.cipaMandate.findMany({
      where: {
        tenantId,
        status: filters?.status,
      },
      orderBy: { startDate: 'desc' },
      skip,
      take: perPage,
    });

    return records.map((record) =>
      CipaMandate.create(
        mapCipaMandatePrismaToDomain(record),
        new UniqueEntityID(record.id),
      ),
    );
  }

  async update(
    data: UpdateCipaMandateSchema,
  ): Promise<CipaMandate | null> {
    const existing = await prisma.cipaMandate.findUnique({
      where: { id: data.id.toString() },
    });

    if (!existing) return null;

    const record = await prisma.cipaMandate.update({
      where: { id: data.id.toString() },
      data: {
        name: data.name,
        startDate: data.startDate,
        endDate: data.endDate,
        status: data.status,
        electionDate: data.electionDate,
        notes: data.notes,
      },
    });

    return CipaMandate.create(
      mapCipaMandatePrismaToDomain(record),
      new UniqueEntityID(record.id),
    );
  }
}
