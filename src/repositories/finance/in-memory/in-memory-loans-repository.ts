import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Loan } from '@/entities/finance/loan';
import type {
  LoansRepository,
  CreateLoanSchema,
  UpdateLoanSchema,
  FindManyLoansOptions,
  FindManyLoansResult,
} from '../loans-repository';

export class InMemoryLoansRepository implements LoansRepository {
  public items: Loan[] = [];

  async create(data: CreateLoanSchema): Promise<Loan> {
    const loan = Loan.create({
      tenantId: new UniqueEntityID(data.tenantId),
      bankAccountId: new UniqueEntityID(data.bankAccountId),
      costCenterId: new UniqueEntityID(data.costCenterId),
      name: data.name,
      type: data.type,
      contractNumber: data.contractNumber,
      principalAmount: data.principalAmount,
      outstandingBalance: data.outstandingBalance,
      interestRate: data.interestRate,
      interestType: data.interestType,
      startDate: data.startDate,
      endDate: data.endDate,
      totalInstallments: data.totalInstallments,
      paidInstallments: data.paidInstallments ?? 0,
      installmentDay: data.installmentDay,
      notes: data.notes,
      metadata: data.metadata ?? {},
    });

    this.items.push(loan);
    return loan;
  }

  async findById(id: UniqueEntityID, tenantId: string): Promise<Loan | null> {
    const item = this.items.find(
      (i) =>
        !i.deletedAt && i.id.equals(id) && i.tenantId.toString() === tenantId,
    );
    return item ?? null;
  }

  async findMany(options: FindManyLoansOptions): Promise<FindManyLoansResult> {
    const page = options.page ?? 1;
    const limit = options.limit ?? 20;

    const filtered = this.items.filter((i) => {
      if (i.deletedAt) return false;
      if (i.tenantId.toString() !== options.tenantId) return false;

      if (
        options.bankAccountId &&
        i.bankAccountId.toString() !== options.bankAccountId
      )
        return false;
      if (
        options.costCenterId &&
        i.costCenterId.toString() !== options.costCenterId
      )
        return false;
      if (options.type && i.type !== options.type) return false;
      if (options.status && i.status !== options.status) return false;

      if (options.search) {
        const term = options.search.toLowerCase();
        const matchesName = i.name.toLowerCase().includes(term);
        const matchesContract =
          i.contractNumber?.toLowerCase().includes(term) ?? false;
        if (!matchesName && !matchesContract) return false;
      }

      return true;
    });

    const total = filtered.length;
    const start = (page - 1) * limit;
    const loans = filtered.slice(start, start + limit);

    return { loans, total };
  }

  async update(data: UpdateLoanSchema): Promise<Loan | null> {
    const item = this.items.find((i) => !i.deletedAt && i.id.equals(data.id));
    if (!item) return null;

    if (data.name !== undefined) item.name = data.name;
    if (data.contractNumber !== undefined)
      item.contractNumber = data.contractNumber ?? undefined;
    if (data.status !== undefined) item.status = data.status;
    if (data.outstandingBalance !== undefined)
      item.outstandingBalance = data.outstandingBalance;
    if (data.paidInstallments !== undefined)
      item.paidInstallments = data.paidInstallments;
    if (data.notes !== undefined) item.notes = data.notes ?? undefined;
    if (data.endDate !== undefined) item.endDate = data.endDate ?? undefined;

    return item;
  }

  async delete(id: UniqueEntityID): Promise<void> {
    const item = this.items.find((i) => !i.deletedAt && i.id.equals(id));
    if (item) item.delete();
  }
}
