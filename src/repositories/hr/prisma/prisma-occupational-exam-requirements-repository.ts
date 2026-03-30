import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { OccupationalExamRequirement } from '@/entities/hr/occupational-exam-requirement';
import { prisma } from '@/lib/prisma';
import { mapOccupationalExamRequirementPrismaToDomain } from '@/mappers/hr/occupational-exam-requirement';
import type {
  OccupationalExamRequirementsRepository,
  CreateOccupationalExamRequirementSchema,
  FindOccupationalExamRequirementFilters,
} from '../occupational-exam-requirements-repository';

export class PrismaOccupationalExamRequirementsRepository
  implements OccupationalExamRequirementsRepository
{
  async create(
    data: CreateOccupationalExamRequirementSchema,
  ): Promise<OccupationalExamRequirement> {
    const record = await prisma.occupationalExamRequirement.create({
      data: {
        tenantId: data.tenantId,
        positionId: data.positionId,
        examType: data.examType,
        examCategory: data.examCategory,
        frequencyMonths: data.frequencyMonths,
        isMandatory: data.isMandatory ?? true,
        description: data.description,
      },
    });

    return OccupationalExamRequirement.create(
      mapOccupationalExamRequirementPrismaToDomain(record),
      new UniqueEntityID(record.id),
    );
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<OccupationalExamRequirement | null> {
    const record = await prisma.occupationalExamRequirement.findFirst({
      where: { id: id.toString(), tenantId },
    });

    if (!record) return null;

    return OccupationalExamRequirement.create(
      mapOccupationalExamRequirementPrismaToDomain(record),
      new UniqueEntityID(record.id),
    );
  }

  async findMany(
    tenantId: string,
    filters?: FindOccupationalExamRequirementFilters,
  ): Promise<OccupationalExamRequirement[]> {
    const page = filters?.page ?? 1;
    const perPage = Math.min(filters?.perPage ?? 50, 100);
    const skip = (page - 1) * perPage;

    const records = await prisma.occupationalExamRequirement.findMany({
      where: {
        tenantId,
        positionId: filters?.positionId,
        examCategory: filters?.examCategory,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: perPage,
    });

    return records.map((record) =>
      OccupationalExamRequirement.create(
        mapOccupationalExamRequirementPrismaToDomain(record),
        new UniqueEntityID(record.id),
      ),
    );
  }

  async findByPositionId(
    positionId: UniqueEntityID,
    tenantId: string,
  ): Promise<OccupationalExamRequirement[]> {
    const records = await prisma.occupationalExamRequirement.findMany({
      where: {
        tenantId,
        positionId: positionId.toString(),
      },
      orderBy: { examType: 'asc' },
    });

    return records.map((record) =>
      OccupationalExamRequirement.create(
        mapOccupationalExamRequirementPrismaToDomain(record),
        new UniqueEntityID(record.id),
      ),
    );
  }

  async delete(id: UniqueEntityID): Promise<void> {
    await prisma.occupationalExamRequirement.delete({
      where: { id: id.toString() },
    });
  }
}
