import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { BenefitPlan } from '@/entities/hr/benefit-plan';
import { prisma } from '@/lib/prisma';
import { mapBenefitPlanPrismaToDomain } from '@/mappers/hr/benefit-plan';
import type {
  BenefitPlansRepository,
  CreateBenefitPlanSchema,
  FindBenefitPlanFilters,
  UpdateBenefitPlanSchema,
} from '../benefit-plans-repository';

export class PrismaBenefitPlansRepository implements BenefitPlansRepository {
  async create(data: CreateBenefitPlanSchema): Promise<BenefitPlan> {
    const planData = await prisma.benefitPlan.create({
      data: {
        tenantId: data.tenantId,
        name: data.name,
        type: data.type,
        provider: data.provider,
        policyNumber: data.policyNumber,
        isActive: data.isActive ?? true,
        rules: data.rules ?? undefined,
        description: data.description,
      },
    });

    return BenefitPlan.create(
      mapBenefitPlanPrismaToDomain(planData),
      new UniqueEntityID(planData.id),
    );
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<BenefitPlan | null> {
    const planData = await prisma.benefitPlan.findFirst({
      where: { id: id.toString(), tenantId },
    });

    if (!planData) return null;

    return BenefitPlan.create(
      mapBenefitPlanPrismaToDomain(planData),
      new UniqueEntityID(planData.id),
    );
  }

  async findMany(
    tenantId: string,
    filters?: FindBenefitPlanFilters,
  ): Promise<{ benefitPlans: BenefitPlan[]; total: number }> {
    const page = filters?.page ?? 1;
    const perPage = Math.min(filters?.perPage ?? 20, 100);
    const skip = (page - 1) * perPage;

    const where = {
      tenantId,
      type: filters?.type,
      isActive: filters?.isActive,
      ...(filters?.search
        ? { name: { contains: filters.search, mode: 'insensitive' as const } }
        : {}),
    };

    const [benefitPlansData, total] = await Promise.all([
      prisma.benefitPlan.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: perPage,
      }),
      prisma.benefitPlan.count({ where }),
    ]);

    const benefitPlans = benefitPlansData.map((plan) =>
      BenefitPlan.create(
        mapBenefitPlanPrismaToDomain(plan),
        new UniqueEntityID(plan.id),
      ),
    );

    return { benefitPlans, total };
  }

  async update(data: UpdateBenefitPlanSchema): Promise<BenefitPlan | null> {
    const existingPlan = await prisma.benefitPlan.findUnique({
      where: { id: data.id.toString(), ...(data.tenantId && { tenantId: data.tenantId }), },
    });

    if (!existingPlan) return null;

    const planData = await prisma.benefitPlan.update({
      where: { id: data.id.toString(), ...(data.tenantId && { tenantId: data.tenantId }), },
      data: {
        name: data.name,
        type: data.type,
        provider: data.provider,
        policyNumber: data.policyNumber,
        isActive: data.isActive,
        rules: data.rules ?? undefined,
        description: data.description,
      },
    });

    return BenefitPlan.create(
      mapBenefitPlanPrismaToDomain(planData),
      new UniqueEntityID(planData.id),
    );
  }

  async delete(id: UniqueEntityID, tenantId?: string): Promise<void> {
    await prisma.benefitPlan.delete({
      where: { id: id.toString(), ...(tenantId && { tenantId }), },
    });
  }
}
