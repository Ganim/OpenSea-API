import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { RecurringConfig } from '@/entities/finance/recurring-config';
import type {
  CreateRecurringConfigSchema,
  FindManyRecurringConfigsOptions,
  FindManyRecurringConfigsResult,
  RecurringConfigsRepository,
  UpdateRecurringConfigSchema,
} from '../recurring-configs-repository';

export class InMemoryRecurringConfigsRepository
  implements RecurringConfigsRepository
{
  public items: RecurringConfig[] = [];

  async create(data: CreateRecurringConfigSchema): Promise<RecurringConfig> {
    const config = RecurringConfig.create({
      tenantId: new UniqueEntityID(data.tenantId),
      type: data.type,
      description: data.description,
      categoryId: new UniqueEntityID(data.categoryId),
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
      expectedAmount: data.expectedAmount,
      isVariable: data.isVariable ?? false,
      frequencyUnit: data.frequencyUnit,
      frequencyInterval: data.frequencyInterval ?? 1,
      startDate: data.startDate,
      endDate: data.endDate,
      totalOccurrences: data.totalOccurrences,
      nextDueDate: data.nextDueDate,
      interestRate: data.interestRate,
      penaltyRate: data.penaltyRate,
      notes: data.notes,
      createdBy: data.createdBy,
    });

    this.items.push(config);
    return config;
  }

  async findById(
    id: string,
    tenantId: string,
  ): Promise<RecurringConfig | null> {
    return (
      this.items.find(
        (c) =>
          c.id.toString() === id &&
          c.tenantId.toString() === tenantId &&
          !c.deletedAt,
      ) ?? null
    );
  }

  async findMany(
    options: FindManyRecurringConfigsOptions,
  ): Promise<FindManyRecurringConfigsResult> {
    const { tenantId, page = 1, limit = 20, type, status, search } = options;

    let filtered = this.items.filter(
      (c) => c.tenantId.toString() === tenantId && !c.deletedAt,
    );

    if (type) {
      filtered = filtered.filter((c) => c.type === type);
    }
    if (status) {
      filtered = filtered.filter((c) => c.status === status);
    }
    if (search) {
      const lower = search.toLowerCase();
      filtered = filtered.filter((c) =>
        c.description.toLowerCase().includes(lower),
      );
    }

    const total = filtered.length;
    const start = (page - 1) * limit;
    const configs = filtered.slice(start, start + limit);

    return { configs, total };
  }

  async findActiveForGeneration(
    endDate: Date,
    tenantId: string,
  ): Promise<RecurringConfig[]> {
    return this.items.filter(
      (c) =>
        c.tenantId.toString() === tenantId &&
        c.status === 'ACTIVE' &&
        !c.deletedAt &&
        c.nextDueDate !== undefined &&
        c.nextDueDate <= endDate,
    );
  }

  async update(
    data: UpdateRecurringConfigSchema,
  ): Promise<RecurringConfig | null> {
    const index = this.items.findIndex(
      (c) =>
        c.id.toString() === data.id &&
        c.tenantId.toString() === data.tenantId &&
        !c.deletedAt,
    );

    if (index === -1) return null;

    const config = this.items[index];

    if (data.description !== undefined) config.description = data.description;
    if (data.expectedAmount !== undefined) config.expectedAmount = data.expectedAmount;
    if (data.frequencyUnit !== undefined) config.frequencyUnit = data.frequencyUnit;
    if (data.frequencyInterval !== undefined) config.frequencyInterval = data.frequencyInterval;
    if (data.endDate !== undefined) config.endDate = data.endDate ?? undefined;
    if (data.interestRate !== undefined) config.interestRate = data.interestRate ?? undefined;
    if (data.penaltyRate !== undefined) config.penaltyRate = data.penaltyRate ?? undefined;
    if (data.notes !== undefined) config.notes = data.notes ?? undefined;
    if (data.status !== undefined) config.status = data.status;
    if (data.generatedCount !== undefined) config.generatedCount = data.generatedCount;
    if (data.lastGeneratedDate !== undefined) config.lastGeneratedDate = data.lastGeneratedDate;
    if (data.nextDueDate !== undefined) config.nextDueDate = data.nextDueDate ?? undefined;
    if (data.bankAccountId !== undefined)
      config.bankAccountId = data.bankAccountId
        ? new UniqueEntityID(data.bankAccountId)
        : undefined;
    if (data.costCenterId !== undefined)
      config.costCenterId = data.costCenterId
        ? new UniqueEntityID(data.costCenterId)
        : undefined;

    return config;
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const index = this.items.findIndex(
      (c) => c.id.toString() === id && c.tenantId.toString() === tenantId,
    );
    if (index !== -1) {
      this.items.splice(index, 1);
    }
  }
}
