import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { ReviewCycle } from '@/entities/hr/review-cycle';
import { prisma } from '@/lib/prisma';
import { mapReviewCyclePrismaToDomain } from '@/mappers/hr/review-cycle';
import type {
  CreateReviewCycleSchema,
  FindReviewCycleFilters,
  ReviewCyclesRepository,
  UpdateReviewCycleSchema,
} from '../review-cycles-repository';

export class PrismaReviewCyclesRepository implements ReviewCyclesRepository {
  async create(data: CreateReviewCycleSchema): Promise<ReviewCycle> {
    const cycleData = await prisma.reviewCycle.create({
      data: {
        tenantId: data.tenantId,
        name: data.name,
        description: data.description,
        type: data.type,
        startDate: data.startDate,
        endDate: data.endDate,
        status: data.status ?? 'DRAFT',
        isActive: data.isActive ?? true,
      },
    });

    return ReviewCycle.create(
      mapReviewCyclePrismaToDomain(cycleData),
      new UniqueEntityID(cycleData.id),
    );
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<ReviewCycle | null> {
    const cycleData = await prisma.reviewCycle.findFirst({
      where: { id: id.toString(), tenantId, deletedAt: null },
    });

    if (!cycleData) return null;

    return ReviewCycle.create(
      mapReviewCyclePrismaToDomain(cycleData),
      new UniqueEntityID(cycleData.id),
    );
  }

  async findMany(
    tenantId: string,
    filters?: FindReviewCycleFilters,
  ): Promise<{ reviewCycles: ReviewCycle[]; total: number }> {
    const page = filters?.page ?? 1;
    const perPage = Math.min(filters?.perPage ?? 20, 100);
    const skip = (page - 1) * perPage;

    const where = {
      tenantId,
      deletedAt: null,
      type: filters?.type,
      status: filters?.status,
      isActive: filters?.isActive,
      ...(filters?.search
        ? {
            name: {
              contains: filters.search,
              mode: 'insensitive' as const,
            },
          }
        : {}),
    };

    const [cyclesData, total] = await Promise.all([
      prisma.reviewCycle.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: perPage,
      }),
      prisma.reviewCycle.count({ where }),
    ]);

    const reviewCycles = cyclesData.map((cycle) =>
      ReviewCycle.create(
        mapReviewCyclePrismaToDomain(cycle),
        new UniqueEntityID(cycle.id),
      ),
    );

    return { reviewCycles, total };
  }

  async update(data: UpdateReviewCycleSchema): Promise<ReviewCycle | null> {
    const existingCycle = await prisma.reviewCycle.findUnique({
      where: { id: data.id.toString() },
    });

    if (!existingCycle) return null;

    const cycleData = await prisma.reviewCycle.update({
      where: { id: data.id.toString() },
      data: {
        name: data.name,
        description: data.description,
        type: data.type,
        startDate: data.startDate,
        endDate: data.endDate,
        status: data.status,
        isActive: data.isActive,
      },
    });

    return ReviewCycle.create(
      mapReviewCyclePrismaToDomain(cycleData),
      new UniqueEntityID(cycleData.id),
    );
  }

  async delete(id: UniqueEntityID): Promise<void> {
    await prisma.reviewCycle.update({
      where: { id: id.toString() },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });
  }
}
