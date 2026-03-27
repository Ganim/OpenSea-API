import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { FlexBenefitAllocation } from '@/entities/hr/flex-benefit-allocation';
import type {
  CreateFlexBenefitAllocationSchema,
  FindFlexBenefitAllocationFilters,
  FlexBenefitAllocationsRepository,
  UpdateFlexBenefitAllocationSchema,
} from '../flex-benefit-allocations-repository';

export class InMemoryFlexBenefitAllocationsRepository
  implements FlexBenefitAllocationsRepository
{
  public items: FlexBenefitAllocation[] = [];

  async create(
    data: CreateFlexBenefitAllocationSchema,
  ): Promise<FlexBenefitAllocation> {
    const allocation = FlexBenefitAllocation.create({
      tenantId: new UniqueEntityID(data.tenantId),
      employeeId: data.employeeId,
      month: data.month,
      year: data.year,
      totalBudget: data.totalBudget,
      allocations: data.allocations,
      status: data.status ?? 'DRAFT',
    });

    this.items.push(allocation);
    return allocation;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<FlexBenefitAllocation | null> {
    return (
      this.items.find(
        (allocation) =>
          allocation.id.equals(id) &&
          allocation.tenantId.toString() === tenantId,
      ) ?? null
    );
  }

  async findByEmployeeAndMonth(
    employeeId: UniqueEntityID,
    month: number,
    year: number,
    tenantId: string,
  ): Promise<FlexBenefitAllocation | null> {
    return (
      this.items.find(
        (allocation) =>
          allocation.employeeId.equals(employeeId) &&
          allocation.month === month &&
          allocation.year === year &&
          allocation.tenantId.toString() === tenantId,
      ) ?? null
    );
  }

  async findMany(
    tenantId: string,
    filters?: FindFlexBenefitAllocationFilters,
  ): Promise<{ allocations: FlexBenefitAllocation[]; total: number }> {
    let filtered = this.items.filter(
      (allocation) => allocation.tenantId.toString() === tenantId,
    );

    if (filters?.employeeId) {
      filtered = filtered.filter((allocation) =>
        allocation.employeeId.equals(filters.employeeId!),
      );
    }
    if (filters?.month !== undefined) {
      filtered = filtered.filter(
        (allocation) => allocation.month === filters.month,
      );
    }
    if (filters?.year !== undefined) {
      filtered = filtered.filter(
        (allocation) => allocation.year === filters.year,
      );
    }
    if (filters?.status) {
      filtered = filtered.filter(
        (allocation) => allocation.status === filters.status,
      );
    }

    const total = filtered.length;
    const sorted = filtered.sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });
    const page = filters?.page ?? 1;
    const perPage = Math.min(filters?.perPage ?? 20, 100);

    return {
      allocations: sorted.slice((page - 1) * perPage, page * perPage),
      total,
    };
  }

  async update(
    data: UpdateFlexBenefitAllocationSchema,
  ): Promise<FlexBenefitAllocation | null> {
    const index = this.items.findIndex((allocation) =>
      allocation.id.equals(data.id),
    );
    if (index === -1) return null;

    const allocation = this.items[index];

    if (data.allocations !== undefined) {
      allocation.updateAllocations(data.allocations);
    }
    if (data.status === 'CONFIRMED') {
      allocation.confirm();
    }
    if (data.status === 'LOCKED') {
      allocation.lock();
    }

    return allocation;
  }
}
