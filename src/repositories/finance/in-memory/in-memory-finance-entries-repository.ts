import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { FinanceEntry } from '@/entities/finance/finance-entry';
import type {
  FinanceEntriesRepository,
  CreateFinanceEntrySchema,
  UpdateFinanceEntrySchema,
  FindManyFinanceEntriesOptions,
  FindManyResult,
  DateRangeSum,
  CategorySum,
  CostCenterSum,
  OverdueSum,
  OverdueByParty,
} from '../finance-entries-repository';

export class InMemoryFinanceEntriesRepository
  implements FinanceEntriesRepository
{
  public items: FinanceEntry[] = [];
  private codeSequences: Map<string, number> = new Map();

  async create(
    data: CreateFinanceEntrySchema,
    _tx?: unknown,
  ): Promise<FinanceEntry> {
    const entry = FinanceEntry.create({
      tenantId: new UniqueEntityID(data.tenantId),
      type: data.type,
      code: data.code,
      description: data.description,
      notes: data.notes,
      categoryId: new UniqueEntityID(data.categoryId),
      companyId: data.companyId
        ? new UniqueEntityID(data.companyId)
        : undefined,
      costCenterId: data.costCenterId
        ? new UniqueEntityID(data.costCenterId)
        : undefined,
      bankAccountId: data.bankAccountId
        ? new UniqueEntityID(data.bankAccountId)
        : undefined,
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
      parentEntryId: data.parentEntryId
        ? new UniqueEntityID(data.parentEntryId)
        : undefined,
      contractId: data.contractId,
      boletoBarcode: data.boletoBarcode,
      boletoDigitLine: data.boletoDigitLine,
      boletoChargeId: data.boletoChargeId,
      boletoBarcodeNumber: data.boletoBarcodeNumber,
      boletoDigitableLine: data.boletoDigitableLine,
      boletoPdfUrl: data.boletoPdfUrl,
      beneficiaryName: data.beneficiaryName,
      beneficiaryCpfCnpj: data.beneficiaryCpfCnpj,
      pixKey: data.pixKey,
      pixKeyType: data.pixKeyType,
      metadata: data.metadata ?? {},
      tags: data.tags ?? [],
      createdBy: data.createdBy,
    });

    this.items.push(entry);
    return entry;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
    _tx?: unknown,
  ): Promise<FinanceEntry | null> {
    const item = this.items.find(
      (i) =>
        !i.deletedAt && i.id.equals(id) && i.tenantId.toString() === tenantId,
    );
    return item ?? null;
  }

  async findByCode(
    code: string,
    tenantId: string,
  ): Promise<FinanceEntry | null> {
    const item = this.items.find(
      (i) =>
        !i.deletedAt && i.code === code && i.tenantId.toString() === tenantId,
    );
    return item ?? null;
  }

  async findMany(
    options: FindManyFinanceEntriesOptions,
    _tx?: unknown,
  ): Promise<FindManyResult> {
    const page = options.page ?? 1;
    const limit = options.limit ?? 20;

    const filtered = this.items.filter((i) => {
      if (i.deletedAt) return false;
      if (i.tenantId.toString() !== options.tenantId) return false;

      if (options.type && i.type !== options.type) return false;
      if (options.status && i.status !== options.status) return false;
      if (options.categoryId && i.categoryId.toString() !== options.categoryId)
        return false;
      if (options.companyId && i.companyId?.toString() !== options.companyId)
        return false;
      if (
        options.costCenterId &&
        i.costCenterId?.toString() !== options.costCenterId
      )
        return false;
      if (
        options.bankAccountId &&
        i.bankAccountId?.toString() !== options.bankAccountId
      )
        return false;

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
        const diffDays = Math.floor(
          (now.getTime() - i.dueDate.getTime()) / (1000 * 60 * 60 * 24),
        );
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

      if (
        options.parentEntryId &&
        i.parentEntryId?.toString() !== options.parentEntryId
      )
        return false;

      if (options.contractId && i.contractId !== options.contractId)
        return false;

      if (options.search) {
        const term = options.search.toLowerCase();
        const matchesDescription = i.description.toLowerCase().includes(term);
        const matchesCode = i.code.toLowerCase().includes(term);
        const matchesSupplier =
          i.supplierName?.toLowerCase().includes(term) ?? false;
        const matchesCustomer =
          i.customerName?.toLowerCase().includes(term) ?? false;
        if (
          !matchesDescription &&
          !matchesCode &&
          !matchesSupplier &&
          !matchesCustomer
        )
          return false;
      }

      return true;
    });

    const sortBy = options.sortBy || 'createdAt';
    const sortDirection = options.sortOrder === 'asc' ? 1 : -1;
    filtered.sort((a, b) => {
      const aVal = a[sortBy as keyof typeof a] ?? '';
      const bVal = b[sortBy as keyof typeof b] ?? '';
      return aVal < bVal
        ? -1 * sortDirection
        : aVal > bVal
          ? 1 * sortDirection
          : 0;
    });

    const total = filtered.length;
    const start = (page - 1) * limit;
    const entries = filtered.slice(start, start + limit);

    return { entries, total };
  }

  async update(
    data: UpdateFinanceEntrySchema,
    _tx?: unknown,
  ): Promise<FinanceEntry | null> {
    const item = this.items.find((i) => !i.deletedAt && i.id.equals(data.id));
    if (!item) return null;

    if (data.description !== undefined) item.description = data.description;
    if (data.notes !== undefined) item.notes = data.notes ?? undefined;
    if (data.categoryId !== undefined)
      item.categoryId = new UniqueEntityID(data.categoryId);
    if (data.costCenterId !== undefined)
      item.costCenterId = data.costCenterId
        ? new UniqueEntityID(data.costCenterId)
        : undefined;
    if (data.bankAccountId !== undefined)
      item.bankAccountId = data.bankAccountId
        ? new UniqueEntityID(data.bankAccountId)
        : undefined;
    if (data.supplierName !== undefined)
      item.supplierName = data.supplierName ?? undefined;
    if (data.customerName !== undefined)
      item.customerName = data.customerName ?? undefined;
    if (data.expectedAmount !== undefined)
      item.expectedAmount = data.expectedAmount;
    if (data.discount !== undefined) item.discount = data.discount;
    if (data.interest !== undefined) item.interest = data.interest;
    if (data.penalty !== undefined) item.penalty = data.penalty;
    if (data.dueDate !== undefined) item.dueDate = data.dueDate;
    if (data.competenceDate !== undefined)
      item.competenceDate = data.competenceDate ?? undefined;
    if (data.status !== undefined) item.status = data.status;
    if (data.actualAmount !== undefined) item.actualAmount = data.actualAmount;
    if (data.paymentDate !== undefined) item.paymentDate = data.paymentDate;
    if (data.boletoBarcode !== undefined)
      item.boletoBarcode = data.boletoBarcode ?? undefined;
    if (data.boletoDigitLine !== undefined)
      item.boletoDigitLine = data.boletoDigitLine ?? undefined;
    if (data.boletoChargeId !== undefined)
      item.boletoChargeId = data.boletoChargeId ?? undefined;
    if (data.boletoBarcodeNumber !== undefined)
      item.boletoBarcodeNumber = data.boletoBarcodeNumber ?? undefined;
    if (data.boletoDigitableLine !== undefined)
      item.boletoDigitableLine = data.boletoDigitableLine ?? undefined;
    if (data.boletoPdfUrl !== undefined)
      item.boletoPdfUrl = data.boletoPdfUrl ?? undefined;
    if (data.beneficiaryName !== undefined)
      item.beneficiaryName = data.beneficiaryName ?? undefined;
    if (data.beneficiaryCpfCnpj !== undefined)
      item.beneficiaryCpfCnpj = data.beneficiaryCpfCnpj ?? undefined;
    if (data.pixKey !== undefined) item.pixKey = data.pixKey ?? undefined;
    if (data.pixKeyType !== undefined)
      item.pixKeyType = data.pixKeyType ?? undefined;
    if (data.pixChargeId !== undefined)
      item.pixChargeId = data.pixChargeId ?? undefined;
    if (data.fiscalDocumentId !== undefined)
      item.fiscalDocumentId = data.fiscalDocumentId ?? undefined;
    if (data.tags !== undefined) {
      // Tags don't have a setter, but we need to update the underlying props
      // Using Object.assign to update the internal tags array
      item.tags.length = 0;
      item.tags.push(...data.tags);
    }

    return item;
  }

  async delete(id: UniqueEntityID, _tenantId?: string): Promise<void> {
    const item = this.items.find((i) => !i.deletedAt && i.id.equals(id));
    if (item) item.delete();
  }

  async generateNextCode(
    tenantId: string,
    type: string,
    _tx?: unknown,
  ): Promise<string> {
    const prefix = type === 'PAYABLE' ? 'PAG' : 'REC';
    const key = `${tenantId}:${prefix}`;
    const current = this.codeSequences.get(key) ?? 0;
    const next = current + 1;
    this.codeSequences.set(key, next);
    return `${prefix}-${next.toString().padStart(3, '0')}`;
  }

  // Aggregation methods

  private getActiveEntries(tenantId: string): FinanceEntry[] {
    return this.items.filter(
      (i) => !i.deletedAt && i.tenantId.toString() === tenantId,
    );
  }

  private formatDateKey(date: Date, groupBy: 'day' | 'week' | 'month'): string {
    const d = new Date(date);
    if (groupBy === 'day') {
      return d.toISOString().split('T')[0];
    }
    if (groupBy === 'week') {
      const day = d.getUTCDay();
      const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
      d.setUTCDate(diff);
      return d.toISOString().split('T')[0];
    }
    // month
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-01`;
  }

  async sumByDateRange(
    tenantId: string,
    type: string | undefined,
    from: Date,
    to: Date,
    groupBy: 'day' | 'week' | 'month',
  ): Promise<DateRangeSum[]> {
    const entries = this.getActiveEntries(tenantId).filter((i) => {
      if (type && i.type !== type) return false;
      return i.dueDate >= from && i.dueDate <= to;
    });

    const map = new Map<string, number>();
    for (const e of entries) {
      const key = this.formatDateKey(e.dueDate, groupBy);
      map.set(key, (map.get(key) ?? 0) + e.expectedAmount);
    }

    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, total]) => ({ date, total }));
  }

  // categoryNames map is populated externally in tests via public property
  public categoryNames: Map<string, string> = new Map();
  public costCenterNames: Map<string, string> = new Map();

  async sumByCategory(
    tenantId: string,
    type: string | undefined,
    from: Date,
    to: Date,
  ): Promise<CategorySum[]> {
    const entries = this.getActiveEntries(tenantId).filter((i) => {
      if (type && i.type !== type) return false;
      return i.dueDate >= from && i.dueDate <= to;
    });

    const map = new Map<string, number>();
    for (const e of entries) {
      const catId = e.categoryId.toString();
      map.set(catId, (map.get(catId) ?? 0) + e.expectedAmount);
    }

    return Array.from(map.entries())
      .sort(([, a], [, b]) => b - a)
      .map(([categoryId, total]) => ({
        categoryId,
        categoryName: this.categoryNames.get(categoryId) ?? categoryId,
        total,
      }));
  }

  async sumByCostCenter(
    tenantId: string,
    type: string | undefined,
    from: Date,
    to: Date,
  ): Promise<CostCenterSum[]> {
    const entries = this.getActiveEntries(tenantId).filter((i) => {
      if (type && i.type !== type) return false;
      return i.dueDate >= from && i.dueDate <= to;
    });

    const map = new Map<string, number>();
    for (const e of entries) {
      const ccId = e.costCenterId?.toString() ?? 'unassigned';
      map.set(ccId, (map.get(ccId) ?? 0) + e.expectedAmount);
    }

    return Array.from(map.entries())
      .sort(([, a], [, b]) => b - a)
      .map(([costCenterId, total]) => ({
        costCenterId,
        costCenterName: this.costCenterNames.get(costCenterId) ?? costCenterId,
        total,
      }));
  }

  async countByStatus(
    tenantId: string,
    type?: string,
  ): Promise<Record<string, number>> {
    const entries = this.getActiveEntries(tenantId).filter((i) => {
      if (type && i.type !== type) return false;
      return true;
    });

    const counts: Record<string, number> = {};
    for (const e of entries) {
      counts[e.status] = (counts[e.status] ?? 0) + 1;
    }
    return counts;
  }

  async sumOverdue(tenantId: string, type: string): Promise<OverdueSum> {
    const now = new Date();
    const overdueStatuses = ['PAID', 'RECEIVED', 'CANCELLED'];
    const entries = this.getActiveEntries(tenantId).filter(
      (i) =>
        i.type === type &&
        i.dueDate < now &&
        !overdueStatuses.includes(i.status),
    );

    return {
      total: entries.reduce((sum, e) => sum + e.expectedAmount, 0),
      count: entries.length,
    };
  }

  async topOverdueByCustomer(
    tenantId: string,
    limit = 10,
  ): Promise<OverdueByParty[]> {
    const now = new Date();
    const overdueStatuses = ['PAID', 'RECEIVED', 'CANCELLED'];
    const entries = this.getActiveEntries(tenantId).filter(
      (i) =>
        i.type === 'RECEIVABLE' &&
        i.dueDate < now &&
        !overdueStatuses.includes(i.status) &&
        i.customerName,
    );

    const map = new Map<
      string,
      { total: number; count: number; oldestDueDate: Date }
    >();
    for (const e of entries) {
      const name = e.customerName!;
      const existing = map.get(name);
      if (existing) {
        existing.total += e.expectedAmount;
        existing.count += 1;
        if (e.dueDate < existing.oldestDueDate)
          existing.oldestDueDate = e.dueDate;
      } else {
        map.set(name, {
          total: e.expectedAmount,
          count: 1,
          oldestDueDate: e.dueDate,
        });
      }
    }

    return Array.from(map.entries())
      .sort(([, a], [, b]) => b.total - a.total)
      .slice(0, limit)
      .map(([name, data]) => ({ name, ...data }));
  }

  async topOverdueBySupplier(
    tenantId: string,
    limit = 10,
  ): Promise<OverdueByParty[]> {
    const now = new Date();
    const overdueStatuses = ['PAID', 'RECEIVED', 'CANCELLED'];
    const entries = this.getActiveEntries(tenantId).filter(
      (i) =>
        i.type === 'PAYABLE' &&
        i.dueDate < now &&
        !overdueStatuses.includes(i.status) &&
        i.supplierName,
    );

    const map = new Map<
      string,
      { total: number; count: number; oldestDueDate: Date }
    >();
    for (const e of entries) {
      const name = e.supplierName!;
      const existing = map.get(name);
      if (existing) {
        existing.total += e.expectedAmount;
        existing.count += 1;
        if (e.dueDate < existing.oldestDueDate)
          existing.oldestDueDate = e.dueDate;
      } else {
        map.set(name, {
          total: e.expectedAmount,
          count: 1,
          oldestDueDate: e.dueDate,
        });
      }
    }

    return Array.from(map.entries())
      .sort(([, a], [, b]) => b.total - a.total)
      .slice(0, limit)
      .map(([name, data]) => ({ name, ...data }));
  }
}
