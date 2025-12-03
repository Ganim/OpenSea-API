export { mapBonusPrismaToDomain } from './bonus-prisma-to-domain';

// Direct exports from bonus-to-dto
export interface BonusDTO {
  id: string;
  employeeId: string;
  name: string;
  amount: number;
  reason: string;
  date: string;
  isPaid: boolean;
  paidAt: string | null;
  payrollId: string | null;
  createdAt: string;
  updatedAt: string;
}

export { bonusToDTO } from './bonus-to-dto';
