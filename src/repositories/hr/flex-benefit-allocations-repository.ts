import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { FlexBenefitAllocation } from '@/entities/hr/flex-benefit-allocation';

export interface CreateFlexBenefitAllocationSchema {
  tenantId: string;
  employeeId: UniqueEntityID;
  month: number;
  year: number;
  totalBudget: number;
  allocations: Record<string, number>;
  status?: string;
}

export interface UpdateFlexBenefitAllocationSchema {
  id: UniqueEntityID;
  allocations?: Record<string, number>;
  status?: string;
  confirmedAt?: Date;
}

export interface FindFlexBenefitAllocationFilters {
  employeeId?: UniqueEntityID;
  month?: number;
  year?: number;
  status?: string;
  page?: number;
  perPage?: number;
}

export interface FlexBenefitAllocationsRepository {
  create(
    data: CreateFlexBenefitAllocationSchema,
  ): Promise<FlexBenefitAllocation>;
  findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<FlexBenefitAllocation | null>;
  findByEmployeeAndMonth(
    employeeId: UniqueEntityID,
    month: number,
    year: number,
    tenantId: string,
  ): Promise<FlexBenefitAllocation | null>;
  findMany(
    tenantId: string,
    filters?: FindFlexBenefitAllocationFilters,
  ): Promise<{ allocations: FlexBenefitAllocation[]; total: number }>;
  update(
    data: UpdateFlexBenefitAllocationSchema,
  ): Promise<FlexBenefitAllocation | null>;
}
