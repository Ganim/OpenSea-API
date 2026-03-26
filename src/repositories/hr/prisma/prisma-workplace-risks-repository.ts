import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { WorkplaceRisk } from '@/entities/hr/workplace-risk';
import { prisma } from '@/lib/prisma';
import { mapWorkplaceRiskPrismaToDomain } from '@/mappers/hr/workplace-risk';
import type {
  WorkplaceRisksRepository,
  CreateWorkplaceRiskSchema,
  FindWorkplaceRiskFilters,
  UpdateWorkplaceRiskSchema,
} from '../workplace-risks-repository';

export class PrismaWorkplaceRisksRepository
  implements WorkplaceRisksRepository
{
  async create(data: CreateWorkplaceRiskSchema): Promise<WorkplaceRisk> {
    const record = await prisma.workplaceRisk.create({
      data: {
        tenantId: data.tenantId,
        safetyProgramId: data.safetyProgramId.toString(),
        name: data.name,
        category: data.category,
        severity: data.severity,
        source: data.source,
        affectedArea: data.affectedArea,
        controlMeasures: data.controlMeasures,
        epiRequired: data.epiRequired,
        isActive: data.isActive ?? true,
      },
    });

    return WorkplaceRisk.create(
      mapWorkplaceRiskPrismaToDomain(record),
      new UniqueEntityID(record.id),
    );
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<WorkplaceRisk | null> {
    const record = await prisma.workplaceRisk.findFirst({
      where: { id: id.toString(), tenantId },
    });

    if (!record) return null;

    return WorkplaceRisk.create(
      mapWorkplaceRiskPrismaToDomain(record),
      new UniqueEntityID(record.id),
    );
  }

  async findMany(
    tenantId: string,
    filters?: FindWorkplaceRiskFilters,
  ): Promise<WorkplaceRisk[]> {
    const page = filters?.page ?? 1;
    const perPage = Math.min(filters?.perPage ?? 50, 100);
    const skip = (page - 1) * perPage;

    const records = await prisma.workplaceRisk.findMany({
      where: {
        tenantId,
        safetyProgramId: filters?.safetyProgramId?.toString(),
        category: filters?.category,
        severity: filters?.severity,
        isActive: filters?.isActive,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: perPage,
    });

    return records.map((record) =>
      WorkplaceRisk.create(
        mapWorkplaceRiskPrismaToDomain(record),
        new UniqueEntityID(record.id),
      ),
    );
  }

  async update(
    data: UpdateWorkplaceRiskSchema,
  ): Promise<WorkplaceRisk | null> {
    const existing = await prisma.workplaceRisk.findUnique({
      where: { id: data.id.toString() },
    });

    if (!existing) return null;

    const record = await prisma.workplaceRisk.update({
      where: { id: data.id.toString() },
      data: {
        name: data.name,
        category: data.category,
        severity: data.severity,
        source: data.source,
        affectedArea: data.affectedArea,
        controlMeasures: data.controlMeasures,
        epiRequired: data.epiRequired,
        isActive: data.isActive,
      },
    });

    return WorkplaceRisk.create(
      mapWorkplaceRiskPrismaToDomain(record),
      new UniqueEntityID(record.id),
    );
  }

  async delete(id: UniqueEntityID): Promise<void> {
    await prisma.workplaceRisk.delete({
      where: { id: id.toString() },
    });
  }
}
