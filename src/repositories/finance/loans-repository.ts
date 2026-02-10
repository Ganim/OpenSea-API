import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Loan } from '@/entities/finance/loan';

export interface CreateLoanSchema {
  tenantId: string;
  bankAccountId: string;
  costCenterId: string;
  name: string;
  type: string;
  contractNumber?: string;
  principalAmount: number;
  outstandingBalance: number;
  interestRate: number;
  interestType?: string;
  startDate: Date;
  endDate?: Date;
  totalInstallments: number;
  paidInstallments?: number;
  installmentDay?: number;
  notes?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateLoanSchema {
  id: UniqueEntityID;
  name?: string;
  contractNumber?: string | null;
  status?: string;
  outstandingBalance?: number;
  paidInstallments?: number;
  notes?: string | null;
  endDate?: Date | null;
}

export interface FindManyLoansOptions {
  tenantId: string;
  page?: number;
  limit?: number;
  bankAccountId?: string;
  costCenterId?: string;
  type?: string;
  status?: string;
  search?: string;
}

export interface FindManyLoansResult {
  loans: Loan[];
  total: number;
}

export interface LoansRepository {
  create(data: CreateLoanSchema): Promise<Loan>;
  findById(id: UniqueEntityID, tenantId: string): Promise<Loan | null>;
  findMany(options: FindManyLoansOptions): Promise<FindManyLoansResult>;
  update(data: UpdateLoanSchema): Promise<Loan | null>;
  delete(id: UniqueEntityID): Promise<void>;
}
