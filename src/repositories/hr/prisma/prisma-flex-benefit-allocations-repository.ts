import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { FlexBenefitAllocation } from '@/entities/hr/flex-benefit-allocation';
import { prisma } from '@/lib/prisma';
import { mapFlexBenefitAllocationPrismaToDomain } from '@/mappers/hr/flex-benefit-allocation';
import type {
  CreateFlexBenefitAllocationSchema,
  FindFlexBenefitAllocationFilters,
  FlexBenefitAllocationsRepository,
  UpdateFlexBenefitAllocationSchema,
} from '../flex-benefit-allocations-repository';

export class PrismaFlexBenefitAllocationsRepository
  implements FlexBenefitAllocationsRepository
{
  async create(
    data: CreateFlexBenefitAllocationSchema,
  ): Promise<FlexBenefitAllocation> {
    const allocationData = await prisma.flexBenefitAllocation.create({
      data: {
        tenantId: data.tenantId,
        employeeId: data.employeeId.toString(),
        month: data.month,
        year: data.year,
        totalBudget: data.totalBudget,
        allocations: data.allocations,
        status: data.status ?? 'DRAFT',
      },
    });

    return FlexBenefitAllocation.create(
      mapFlexBenefitAllocationPrismaToDomain(allocationData),
      new UniqueEntityID(allocationData.id),
    );
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<FlexBenefitAllocation | null> {
    const allocationData = await prisma.flexBenefitAllocation.findFirst({
      where: { id: id.toString(), tenantId },
    });

    if (!allocationData) return null;

    return FlexBenefitAllocation.create(
      mapFlexBenefitAllocationPrismaToDomain(allocationData),
      new UniqueEntityID(allocationData.id),
    );
  }

  async findByEmployeeAndMonth(
    employeeId: UniqueEntityID,
    month: number,
    year: number,
    tenantId: string,
  ): Promise<FlexBenefitAllocation | null> {
    const allocationData = await prisma.flexBenefitAllocation.findFirst({
      where: {
        tenantId,
        employeeId: employeeId.toString(),
        month,
        year,
      },
    });

    if (!allocationData) return null;

    return FlexBenefitAllocation.create(
      mapFlexBenefitAllocationPrismaToDomain(allocationData),
      new UniqueEntityID(allocationData.id),
    );
  }

  async findMany(
    tenantId: string,
    filters?: FindFlexBenefitAllocationFilters,
  ): Promise<{ allocations: FlexBenefitAllocation[]; total: number }> {
    const page = filters?.page ?? 1;
    const perPage = Math.min(filters?.perPage ?? 20, 100);
    const skip = (page - 1) * perPage;

    const where = {
      tenantId,
      employeeId: filters?.employeeId?.toString(),
      month: filters?.month,
      year: filters?.year,
      status: filters?.status,
    };

    const [allocationsData, total] = await Promise.all([
      prisma.flexBenefitAllocation.findMany({
        where,
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
        skip,
        take: perPage,
      }),
      prisma.flexBenefitAllocation.count({ where }),
    ]);

    const allocations = allocationsData.map((allocation) =>
      FlexBenefitAllocation.create(
        mapFlexBenefitAllocationPrismaToDomain(allocation),
        new UniqueEntityID(allocation.id),
      ),
    );

    return { allocations, total };
  }

  async update(
    data: UpdateFlexBenefitAllocationSchema,
  ): Promise<FlexBenefitAllocation | null> {
    const existingAllocation = await prisma.flexBenefitAllocation.findUnique({
      where: {
        id: data.id.toString(),
        ...(data.tenantId && { tenantId: data.tenantId }),
      },
    });

    if (!existingAllocation) return null;

    const allocationData = await prisma.flexBenefitAllocation.update({
      where: {
        id: data.id.toString(),
        ...(data.tenantId && { tenantId: data.tenantId }),
      },
      data: {
        allocations: data.allocations ?? undefined,
        status: data.status,
        confirmedAt: data.confirmedAt,
      },
    });

    return FlexBenefitAllocation.create(
      mapFlexBenefitAllocationPrismaToDomain(allocationData),
      new UniqueEntityID(allocationData.id),
    );
  }
}
