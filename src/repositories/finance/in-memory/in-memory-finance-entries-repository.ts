import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { FinanceEntry } from '@/entities/finance/finance-entry';
import type {
  FinanceEntriesRepository,
  CreateFinanceEntrySchema,
  UpdateFinanceEntrySchema,
  FindManyFinanceEntriesOptions,
  FindManyResult,
} from '../finance-entries-repository';

export class InMemoryFinanceEntriesRepository implements FinanceEntriesRepository {
  public items: FinanceEntry[] = [];

  async create(data: CreateFinanceEntrySchema): Promise<FinanceEntry> {
    const entry = FinanceEntry.create({
      tenantId: new UniqueEntityID(data.tenantId),
      type: data.type,
      code: data.code,
      description: data.description,
      notes: data.notes,
      categoryId: new UniqueEntityID(data.categoryId),
      costCenterId: new UniqueEntityID(data.costCenterId),
      bankAccountId: data.bankAccountId ? new UniqueEntityID(data.bankAccountId) : undefined,
      supplierName: data.supplierName,
      customerName: data.customerName,
      supplierId: data.supplierId,
      customerId: data.customerId,
      salesOrderId: data.salesOrderId,
      expectedAmount: data.expectedAmount,
      actualAmount: data.actualAmount,
      discount: data.discount ?? 0,
      interest: data.interest ?? 0,
      penalty: data.penalty ?? 0,
      issueDate: data.issueDate,
      dueDate: data.dueDate,
      competenceDate: data.competenceDate,
      paymentDate: data.paymentDate,
      status: data.status ?? 'PENDING',
      recurrenceType: data.recurrenceType ?? 'SINGLE',
      recurrenceInterval: data.recurrenceInterval,
      recurrenceUnit: data.recurrenceUnit,
      totalInstallments: data.totalInstallments,
      currentInstallment: data.currentInstallment,
      parentEntryId: data.parentEntryId ? new UniqueEntityID(data.parentEntryId) : undefined,
      boletoBarcode: data.boletoBarcode,
      boletoDigitLine: data.boletoDigitLine,
      metadata: data.metadata ?? {},
      tags: data.tags ?? [],
      createdBy: data.createdBy,
    });

    this.items.push(entry);
    return entry;
  }

  async findById(id: UniqueEntityID, tenantId: string): Promise<FinanceEntry | null> {
    const item = this.items.find(
      (i) => !i.deletedAt && i.id.equals(id) && i.tenantId.toString() === tenantId,
    );
    return item ?? null;
  }

  async findByCode(code: string, tenantId: string): Promise<FinanceEntry | null> {
    const item = this.items.find(
      (i) => !i.deletedAt && i.code === code && i.tenantId.toString() === tenantId,
    );
    return item ?? null;
  }

  async findMany(options: FindManyFinanceEntriesOptions): Promise<FindManyResult> {
    const page = options.page ?? 1;
    const limit = options.limit ?? 20;

    let filtered = this.items.filter((i) => {
      if (i.deletedAt) return false;
      if (i.tenantId.toString() !== options.tenantId) return false;

      if (options.type && i.type !== options.type) return false;
      if (options.status && i.status !== options.status) return false;
      if (options.categoryId && i.categoryId.toString() !== options.categoryId) return false;
      if (options.costCenterId && i.costCenterId.toString() !== options.costCenterId) return false;
      if (options.bankAccountId && i.bankAccountId?.toString() !== options.bankAccountId) return false;

      if (options.dueDateFrom && i.dueDate < options.dueDateFrom) return false;
      if (options.dueDateTo && i.dueDate > options.dueDateTo) return false;

      if (options.isOverdue !== undefined) {
        const entryIsOverdue = i.isOverdue;
        if (options.isOverdue && !entryIsOverdue) return false;
        if (!options.isOverdue && entryIsOverdue) return false;
      }

      if (options.customerName) {
        const search = options.customerName.toLowerCase();
        if (!i.customerName?.toLowerCase().includes(search)) return false;
      }

      if (options.supplierName) {
        const search = options.supplierName.toLowerCase();
        if (!i.supplierName?.toLowerCase().includes(search)) return false;
      }

      if (options.overdueRange) {
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - i.dueDate.getTime()) / (1000 * 60 * 60 * 24));
        if (!i.isOverdue) return false;

        switch (options.overdueRange) {
          case '1-7':
            if (diffDays < 1 || diffDays > 7) return false;
            break;
          case '8-30':
            if (diffDays < 8 || diffDays > 30) return false;
            break;
          case '31-60':
            if (diffDays < 31 || diffDays > 60) return false;
            break;
          case '60+':
            if (diffDays < 60) return false;
            break;
        }
      }

      if (options.parentEntryId && i.parentEntryId?.toString() !== options.parentEntryId) return false;

      if (options.search) {
        const term = options.search.toLowerCase();
        const matchesDescription = i.description.toLowerCase().includes(term);
        const matchesCode = i.code.toLowerCase().includes(term);
        const matchesSupplier = i.supplierName?.toLowerCase().includes(term) ?? false;
        const matchesCustomer = i.customerName?.toLowerCase().includes(term) ?? false;
        if (!matchesDescription && !matchesCode && !matchesSupplier && !matchesCustomer) return false;
      }

      return true;
    });

    const total = filtered.length;
    const start = (page - 1) * limit;
    const entries = filtered.slice(start, start + limit);

    return { entries, total };
  }

  async update(data: UpdateFinanceEntrySchema): Promise<FinanceEntry | null> {
    const item = this.items.find((i) => !i.deletedAt && i.id.equals(data.id));
    if (!item) return null;

    if (data.description !== undefined) item.description = data.description;
    if (data.notes !== undefined) item.notes = data.notes ?? undefined;
    if (data.categoryId !== undefined) item.categoryId = new UniqueEntityID(data.categoryId);
    if (data.costCenterId !== undefined) item.costCenterId = new UniqueEntityID(data.costCenterId);
    if (data.bankAccountId !== undefined) item.bankAccountId = data.bankAccountId ? new UniqueEntityID(data.bankAccountId) : undefined;
    if (data.supplierName !== undefined) item.supplierName = data.supplierName ?? undefined;
    if (data.customerName !== undefined) item.customerName = data.customerName ?? undefined;
    if (data.expectedAmount !== undefined) item.expectedAmount = data.expectedAmount;
    if (data.discount !== undefined) item.discount = data.discount;
    if (data.interest !== undefined) item.interest = data.interest;
    if (data.penalty !== undefined) item.penalty = data.penalty;
    if (data.dueDate !== undefined) item.dueDate = data.dueDate;
    if (data.competenceDate !== undefined) item.competenceDate = data.competenceDate ?? undefined;
    if (data.status !== undefined) item.status = data.status;
    if (data.actualAmount !== undefined) item.actualAmount = data.actualAmount;
    if (data.paymentDate !== undefined) item.paymentDate = data.paymentDate;
    if (data.boletoBarcode !== undefined) item.boletoBarcode = data.boletoBarcode ?? undefined;
    if (data.boletoDigitLine !== undefined) item.boletoDigitLine = data.boletoDigitLine ?? undefined;
    if (data.tags !== undefined) {
      // Tags don't have a setter, but we need to update the underlying props
      // Using Object.assign to update the internal tags array
      item.tags.length = 0;
      item.tags.push(...data.tags);
    }

    return item;
  }

  async delete(id: UniqueEntityID): Promise<void> {
    const item = this.items.find((i) => !i.deletedAt && i.id.equals(id));
    if (item) item.delete();
  }

  async generateNextCode(tenantId: string, type: string): Promise<string> {
    const count = this.items.filter(
      (i) => i.tenantId.toString() === tenantId && i.type === type,
    ).length;

    const prefix = type === 'PAYABLE' ? 'PAG' : 'REC';
    const nextNumber = (count + 1).toString().padStart(3, '0');

    return `${prefix}-${nextNumber}`;
  }
}
