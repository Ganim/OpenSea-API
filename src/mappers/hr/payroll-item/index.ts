export { mapPayrollItemPrismaToDomain } from './payroll-item-prisma-to-domain';

// Direct exports from payroll-item-to-dto
export interface PayrollItemDTO {
  id: string;
  payrollId: string;
  employeeId: string;
  type: string;
  description: string;
  amount: number;
  isDeduction: boolean;
  referenceId: string | null;
  referenceType: string | null;
  createdAt: string;
  updatedAt: string;
}

export { payrollItemToDTO } from './payroll-item-to-dto';

