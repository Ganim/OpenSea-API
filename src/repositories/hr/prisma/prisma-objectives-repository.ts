import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Objective } from '@/entities/hr/objective';
import { prisma } from '@/lib/prisma';
import { mapObjectivePrismaToDomain } from '@/mappers/hr/objective';
import type {
  CreateObjectiveSchema,
  FindObjectiveFilters,
  ObjectivesRepository,
  UpdateObjectiveSchema,
} from '../objectives-repository';

export class PrismaObjectivesRepository implements ObjectivesRepository {
  async create(data: CreateObjectiveSchema): Promise<Objective> {
    const objectiveData = await prisma.objective.create({
      data: {
        tenantId: data.tenantId,
        title: data.title,
        description: data.description,
        ownerId: data.ownerId.toString(),
        parentId: data.parentId?.toString() ?? null,
        level: data.level,
        status: data.status ?? 'DRAFT',
        period: data.period,
        startDate: data.startDate,
        endDate: data.endDate,
        progress: data.progress ?? 0,
      },
    });

    return Objective.create(
      mapObjectivePrismaToDomain(objectiveData),
      new UniqueEntityID(objectiveData.id),
    );
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<Objective | null> {
    const objectiveData = await prisma.objective.findFirst({
      where: { id: id.toString(), tenantId },
    });

    if (!objectiveData) return null;

    return Objective.create(
      mapObjectivePrismaToDomain(objectiveData),
      new UniqueEntityID(objectiveData.id),
    );
  }

  async findMany(
    tenantId: string,
    filters?: FindObjectiveFilters,
  ): Promise<{ objectives: Objective[]; total: number }> {
    const page = filters?.page ?? 1;
    const perPage = Math.min(filters?.perPage ?? 20, 100);
    const skip = (page - 1) * perPage;

    const where = {
      tenantId,
      ownerId: filters?.ownerId?.toString(),
      parentId: filters?.parentId?.toString(),
      level: filters?.level,
      status: filters?.status,
      period: filters?.period,
    };

    const [objectivesData, total] = await Promise.all([
      prisma.objective.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: perPage,
      }),
      prisma.objective.count({ where }),
    ]);

    const objectives = objectivesData.map((o) =>
      Objective.create(mapObjectivePrismaToDomain(o), new UniqueEntityID(o.id)),
    );

    return { objectives, total };
  }

  async update(data: UpdateObjectiveSchema): Promise<Objective | null> {
    const existing = await prisma.objective.findUnique({
      where: {
        id: data.id.toString(),
        ...(data.tenantId && { tenantId: data.tenantId }),
      },
    });

    if (!existing) return null;

    const objectiveData = await prisma.objective.update({
      where: {
        id: data.id.toString(),
        ...(data.tenantId && { tenantId: data.tenantId }),
      },
      data: {
        title: data.title,
        description: data.description,
        ownerId: data.ownerId?.toString(),
        parentId: data.parentId?.toString(),
        level: data.level,
        status: data.status,
        period: data.period,
        startDate: data.startDate,
        endDate: data.endDate,
        progress: data.progress,
      },
    });

    return Objective.create(
      mapObjectivePrismaToDomain(objectiveData),
      new UniqueEntityID(objectiveData.id),
    );
  }

  async delete(id: UniqueEntityID, tenantId?: string): Promise<void> {
    await prisma.objective.delete({
      where: { id: id.toString(), ...(tenantId && { tenantId }) },
    });
  }
}
