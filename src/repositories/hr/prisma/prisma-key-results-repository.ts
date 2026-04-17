import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { KeyResult } from '@/entities/hr/key-result';
import { prisma } from '@/lib/prisma';
import { mapKeyResultPrismaToDomain } from '@/mappers/hr/key-result';
import type {
  CreateKeyResultSchema,
  FindKeyResultFilters,
  KeyResultsRepository,
  UpdateKeyResultSchema,
} from '../key-results-repository';

export class PrismaKeyResultsRepository implements KeyResultsRepository {
  async create(data: CreateKeyResultSchema): Promise<KeyResult> {
    const keyResultData = await prisma.keyResult.create({
      data: {
        tenantId: data.tenantId,
        objectiveId: data.objectiveId.toString(),
        title: data.title,
        description: data.description,
        type: data.type,
        startValue: data.startValue ?? 0,
        targetValue: data.targetValue,
        currentValue: data.currentValue ?? 0,
        unit: data.unit,
        status: data.status ?? 'ON_TRACK',
        weight: data.weight ?? 1,
      },
    });

    return KeyResult.create(
      mapKeyResultPrismaToDomain(keyResultData),
      new UniqueEntityID(keyResultData.id),
    );
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<KeyResult | null> {
    const keyResultData = await prisma.keyResult.findFirst({
      where: { id: id.toString(), tenantId },
    });

    if (!keyResultData) return null;

    return KeyResult.create(
      mapKeyResultPrismaToDomain(keyResultData),
      new UniqueEntityID(keyResultData.id),
    );
  }

  async findByObjective(
    objectiveId: UniqueEntityID,
    tenantId: string,
  ): Promise<KeyResult[]> {
    const keyResultsData = await prisma.keyResult.findMany({
      where: { objectiveId: objectiveId.toString(), tenantId },
      orderBy: { createdAt: 'asc' },
    });

    return keyResultsData.map((kr) =>
      KeyResult.create(
        mapKeyResultPrismaToDomain(kr),
        new UniqueEntityID(kr.id),
      ),
    );
  }

  async findMany(
    tenantId: string,
    filters?: FindKeyResultFilters,
  ): Promise<{ keyResults: KeyResult[]; total: number }> {
    const page = filters?.page ?? 1;
    const perPage = Math.min(filters?.perPage ?? 20, 100);
    const skip = (page - 1) * perPage;

    const where = {
      tenantId,
      objectiveId: filters?.objectiveId?.toString(),
      status: filters?.status,
    };

    const [keyResultsData, total] = await Promise.all([
      prisma.keyResult.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: perPage,
      }),
      prisma.keyResult.count({ where }),
    ]);

    const keyResults = keyResultsData.map((kr) =>
      KeyResult.create(
        mapKeyResultPrismaToDomain(kr),
        new UniqueEntityID(kr.id),
      ),
    );

    return { keyResults, total };
  }

  async update(data: UpdateKeyResultSchema): Promise<KeyResult | null> {
    const existing = await prisma.keyResult.findUnique({
      where: {
        id: data.id.toString(),
        ...(data.tenantId && { tenantId: data.tenantId }),
      },
    });

    if (!existing) return null;

    const keyResultData = await prisma.keyResult.update({
      where: {
        id: data.id.toString(),
        ...(data.tenantId && { tenantId: data.tenantId }),
      },
      data: {
        title: data.title,
        description: data.description,
        type: data.type,
        startValue: data.startValue,
        targetValue: data.targetValue,
        currentValue: data.currentValue,
        unit: data.unit,
        status: data.status,
        weight: data.weight,
      },
    });

    return KeyResult.create(
      mapKeyResultPrismaToDomain(keyResultData),
      new UniqueEntityID(keyResultData.id),
    );
  }

  async delete(id: UniqueEntityID, tenantId?: string): Promise<void> {
    await prisma.keyResult.delete({
      where: { id: id.toString(), ...(tenantId && { tenantId }) },
    });
  }
}
