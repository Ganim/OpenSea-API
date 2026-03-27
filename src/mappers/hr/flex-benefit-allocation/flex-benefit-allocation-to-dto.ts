import type { FlexBenefitAllocation } from '@/entities/hr/flex-benefit-allocation';

export interface FlexBenefitAllocationDTO {
  id: string;
  employeeId: string;
  month: number;
  year: number;
  totalBudget: number;
  allocations: Record<string, number>;
  allocatedTotal: number;
  remainingBudget: number;
  status: string;
  confirmedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export function flexBenefitAllocationToDTO(
  allocation: FlexBenefitAllocation,
): FlexBenefitAllocationDTO {
  return {
    id: allocation.id.toString(),
    employeeId: allocation.employeeId.toString(),
    month: allocation.month,
    year: allocation.year,
    totalBudget: allocation.totalBudget,
    allocations: allocation.allocations,
    allocatedTotal: allocation.allocatedTotal,
    remainingBudget: allocation.remainingBudget,
    status: allocation.status,
    confirmedAt: allocation.confirmedAt?.toISOString() ?? null,
    createdAt: allocation.createdAt.toISOString(),
    updatedAt: allocation.updatedAt.toISOString(),
  };
}
