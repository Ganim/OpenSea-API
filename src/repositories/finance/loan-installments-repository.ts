import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { LoanInstallment } from '@/entities/finance/loan-installment';
import type { TransactionClient } from '@/lib/transaction-manager';

export interface CreateLoanInstallmentSchema {
  loanId: string;
  bankAccountId?: string;
  installmentNumber: number;
  dueDate: Date;
  principalAmount: number;
  interestAmount: number;
  totalAmount: number;
}

export interface UpdateLoanInstallmentSchema {
  id: UniqueEntityID;
  paidAmount?: number;
  paidAt?: Date;
  status?: string;
  bankAccountId?: string | null;
}

export interface LoanInstallmentsRepository {
  create(data: CreateLoanInstallmentSchema): Promise<LoanInstallment>;
  createMany(
    data: CreateLoanInstallmentSchema[],
    tx?: TransactionClient,
  ): Promise<LoanInstallment[]>;
  findById(id: UniqueEntityID): Promise<LoanInstallment | null>;
  findByLoanId(loanId: UniqueEntityID): Promise<LoanInstallment[]>;
  update(
    data: UpdateLoanInstallmentSchema,
    tx?: TransactionClient,
  ): Promise<LoanInstallment | null>;
  deleteByLoanId(loanId: UniqueEntityID): Promise<void>;
}
