import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { LoanInstallment } from '@/entities/finance/loan-installment';
import type {
  LoanInstallmentsRepository,
  CreateLoanInstallmentSchema,
  UpdateLoanInstallmentSchema,
} from '../loan-installments-repository';

export class InMemoryLoanInstallmentsRepository
  implements LoanInstallmentsRepository
{
  public items: LoanInstallment[] = [];

  async create(data: CreateLoanInstallmentSchema): Promise<LoanInstallment> {
    const installment = LoanInstallment.create({
      loanId: new UniqueEntityID(data.loanId),
      bankAccountId: data.bankAccountId
        ? new UniqueEntityID(data.bankAccountId)
        : undefined,
      installmentNumber: data.installmentNumber,
      dueDate: data.dueDate,
      principalAmount: data.principalAmount,
      interestAmount: data.interestAmount,
      totalAmount: data.totalAmount,
    });

    this.items.push(installment);
    return installment;
  }

  async createMany(
    data: CreateLoanInstallmentSchema[],
  ): Promise<LoanInstallment[]> {
    const installments: LoanInstallment[] = [];
    for (const item of data) {
      const installment = await this.create(item);
      installments.push(installment);
    }
    return installments;
  }

  async findById(id: UniqueEntityID): Promise<LoanInstallment | null> {
    const item = this.items.find((i) => i.id.equals(id));
    return item ?? null;
  }

  async findByLoanId(loanId: UniqueEntityID): Promise<LoanInstallment[]> {
    return this.items
      .filter((i) => i.loanId.equals(loanId))
      .sort((a, b) => a.installmentNumber - b.installmentNumber);
  }

  async update(
    data: UpdateLoanInstallmentSchema,
  ): Promise<LoanInstallment | null> {
    const item = this.items.find((i) => i.id.equals(data.id));
    if (!item) return null;

    if (data.paidAmount !== undefined) item.paidAmount = data.paidAmount;
    if (data.paidAt !== undefined) item.paidAt = data.paidAt;
    if (data.status !== undefined) item.status = data.status;
    if (data.bankAccountId !== undefined) {
      item.bankAccountId = data.bankAccountId
        ? new UniqueEntityID(data.bankAccountId)
        : undefined;
    }

    return item;
  }

  async deleteByLoanId(loanId: UniqueEntityID): Promise<void> {
    this.items = this.items.filter((i) => !i.loanId.equals(loanId));
  }
}
