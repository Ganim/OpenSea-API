import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Contract } from '@/entities/finance/contract';
import type {
  ContractStatus,
  RecurrenceUnit,
} from '@/entities/finance/finance-entry-types';
import type {
  ContractsRepository,
  CreateContractSchema,
  UpdateContractSchema,
  FindManyContractsOptions,
  FindManyContractsResult,
} from '../contracts-repository';

export class InMemoryContractsRepository implements ContractsRepository {
  public items: Contract[] = [];

  async create(data: CreateContractSchema, _tx?: unknown): Promise<Contract> {
    const contract = Contract.create({
      tenantId: new UniqueEntityID(data.tenantId),
      code: data.code,
      title: data.title,
      description: data.description,
      status: data.status as ContractStatus | undefined,
      companyId: data.companyId,
      companyName: data.companyName,
      contactName: data.contactName,
      contactEmail: data.contactEmail,
      totalValue: data.totalValue,
      paymentFrequency: data.paymentFrequency as RecurrenceUnit,
      paymentAmount: data.paymentAmount,
      categoryId: data.categoryId,
      costCenterId: data.costCenterId,
      bankAccountId: data.bankAccountId,
      startDate: data.startDate,
      endDate: data.endDate,
      autoRenew: data.autoRenew,
      renewalPeriodMonths: data.renewalPeriodMonths,
      alertDaysBefore: data.alertDaysBefore,
      folderPath: data.folderPath,
      notes: data.notes,
      metadata: data.metadata ?? {},
      createdBy: data.createdBy,
    });

    this.items.push(contract);
    return contract;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<Contract | null> {
    const item = this.items.find(
      (i) =>
        !i.deletedAt && i.id.equals(id) && i.tenantId.toString() === tenantId,
    );
    return item ?? null;
  }

  async findMany(
    options: FindManyContractsOptions,
  ): Promise<FindManyContractsResult> {
    const page = options.page ?? 1;
    const limit = options.limit ?? 20;

    const filtered = this.items.filter((i) => {
      if (i.deletedAt) return false;
      if (i.tenantId.toString() !== options.tenantId) return false;

      if (options.status && i.status !== options.status) return false;
      if (options.companyId && i.companyId !== options.companyId) return false;

      if (options.companyName) {
        const term = options.companyName.toLowerCase();
        if (!i.companyName.toLowerCase().includes(term)) return false;
      }

      if (options.search) {
        const term = options.search.toLowerCase();
        const matchesTitle = i.title.toLowerCase().includes(term);
        const matchesCompany = i.companyName.toLowerCase().includes(term);
        const matchesCode = i.code.toLowerCase().includes(term);
        if (!matchesTitle && !matchesCompany && !matchesCode) return false;
      }

      if (options.startDateFrom && i.startDate < options.startDateFrom)
        return false;
      if (options.startDateTo && i.startDate > options.startDateTo)
        return false;
      if (options.endDateFrom && i.endDate < options.endDateFrom) return false;
      if (options.endDateTo && i.endDate > options.endDateTo) return false;

      return true;
    });

    const total = filtered.length;
    const start = (page - 1) * limit;
    const contracts = filtered.slice(start, start + limit);

    return { contracts, total };
  }

  async findByCompanyId(
    companyId: string,
    tenantId: string,
  ): Promise<Contract[]> {
    return this.items.filter(
      (i) =>
        !i.deletedAt &&
        i.tenantId.toString() === tenantId &&
        i.companyId === companyId,
    );
  }

  async findByCompanyName(
    companyName: string,
    tenantId: string,
  ): Promise<Contract[]> {
    const term = companyName.toLowerCase();
    return this.items.filter(
      (i) =>
        !i.deletedAt &&
        i.tenantId.toString() === tenantId &&
        i.companyName.toLowerCase().includes(term),
    );
  }

  async update(data: UpdateContractSchema): Promise<Contract | null> {
    const item = this.items.find((i) => !i.deletedAt && i.id.equals(data.id));
    if (!item) return null;

    if (data.title !== undefined) item.title = data.title;
    if (data.description !== undefined)
      item.description = data.description ?? undefined;
    if (data.status !== undefined) item.status = data.status as ContractStatus;
    if (data.companyId !== undefined)
      item.companyId = data.companyId ?? undefined;
    if (data.companyName !== undefined) item.companyName = data.companyName;
    if (data.contactName !== undefined)
      item.contactName = data.contactName ?? undefined;
    if (data.contactEmail !== undefined)
      item.contactEmail = data.contactEmail ?? undefined;
    if (data.totalValue !== undefined) item.totalValue = data.totalValue;
    if (data.paymentFrequency !== undefined)
      item.paymentFrequency = data.paymentFrequency as RecurrenceUnit;
    if (data.paymentAmount !== undefined)
      item.paymentAmount = data.paymentAmount;
    if (data.categoryId !== undefined)
      item.categoryId = data.categoryId ?? undefined;
    if (data.costCenterId !== undefined)
      item.costCenterId = data.costCenterId ?? undefined;
    if (data.bankAccountId !== undefined)
      item.bankAccountId = data.bankAccountId ?? undefined;
    if (data.endDate !== undefined) item.endDate = data.endDate;
    if (data.autoRenew !== undefined) item.autoRenew = data.autoRenew;
    if (data.renewalPeriodMonths !== undefined)
      item.renewalPeriodMonths = data.renewalPeriodMonths ?? undefined;
    if (data.alertDaysBefore !== undefined)
      item.alertDaysBefore = data.alertDaysBefore;
    if (data.folderPath !== undefined)
      item.folderPath = data.folderPath ?? undefined;
    if (data.notes !== undefined) item.notes = data.notes ?? undefined;

    return item;
  }

  async delete(id: UniqueEntityID, _tenantId?: string): Promise<void> {
    const item = this.items.find((i) => !i.deletedAt && i.id.equals(id));
    if (item) item.delete();
  }
}
