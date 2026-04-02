import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { SafetyProgram } from '@/entities/hr/safety-program';
import { prisma } from '@/lib/prisma';
import { mapSafetyProgramPrismaToDomain } from '@/mappers/hr/safety-program';
import type {
  SafetyProgramsRepository,
  CreateSafetyProgramSchema,
  FindSafetyProgramFilters,
  UpdateSafetyProgramSchema,
} from '../safety-programs-repository';

export class PrismaSafetyProgramsRepository
  implements SafetyProgramsRepository
{
  async create(data: CreateSafetyProgramSchema): Promise<SafetyProgram> {
    const record = await prisma.safetyProgram.create({
      data: {
        tenantId: data.tenantId,
        type: data.type,
        name: data.name,
        validFrom: data.validFrom,
        validUntil: data.validUntil,
        responsibleName: data.responsibleName,
        responsibleRegistration: data.responsibleRegistration,
        documentUrl: data.documentUrl,
        status: data.status ?? 'ACTIVE',
        notes: data.notes,
      },
    });

    return SafetyProgram.create(
      mapSafetyProgramPrismaToDomain(record),
      new UniqueEntityID(record.id),
    );
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<SafetyProgram | null> {
    const record = await prisma.safetyProgram.findFirst({
      where: { id: id.toString(), tenantId },
    });

    if (!record) return null;

    return SafetyProgram.create(
      mapSafetyProgramPrismaToDomain(record),
      new UniqueEntityID(record.id),
    );
  }

  async findMany(
    tenantId: string,
    filters?: FindSafetyProgramFilters,
  ): Promise<SafetyProgram[]> {
    const page = filters?.page ?? 1;
    const perPage = Math.min(filters?.perPage ?? 50, 100);
    const skip = (page - 1) * perPage;

    const records = await prisma.safetyProgram.findMany({
      where: {
        tenantId,
        type: filters?.type,
        status: filters?.status,
      },
      orderBy: { validFrom: 'desc' },
      skip,
      take: perPage,
    });

    return records.map((record) =>
      SafetyProgram.create(
        mapSafetyProgramPrismaToDomain(record),
        new UniqueEntityID(record.id),
      ),
    );
  }

  async update(data: UpdateSafetyProgramSchema): Promise<SafetyProgram | null> {
    const existing = await prisma.safetyProgram.findUnique({
      where: { id: data.id.toString() },
    });

    if (!existing) return null;

    const record = await prisma.safetyProgram.update({
      where: { id: data.id.toString() },
      data: {
        type: data.type,
        name: data.name,
        validFrom: data.validFrom,
        validUntil: data.validUntil,
        responsibleName: data.responsibleName,
        responsibleRegistration: data.responsibleRegistration,
        documentUrl: data.documentUrl,
        status: data.status,
        notes: data.notes,
      },
    });

    return SafetyProgram.create(
      mapSafetyProgramPrismaToDomain(record),
      new UniqueEntityID(record.id),
    );
  }

  async delete(id: UniqueEntityID): Promise<void> {
    await prisma.safetyProgram.delete({
      where: { id: id.toString() },
    });
  }
}
