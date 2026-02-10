import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Consortium } from '@/entities/finance/consortium';
import type {
  ConsortiaRepository,
  CreateConsortiumSchema,
  UpdateConsortiumSchema,
  FindManyConsortiaOptions,
  FindManyConsortiaResult,
} from '../consortia-repository';

export class InMemoryConsortiaRepository implements ConsortiaRepository {
  public items: Consortium[] = [];

  async create(data: CreateConsortiumSchema): Promise<Consortium> {
    const consortium = Consortium.create({
      tenantId: new UniqueEntityID(data.tenantId),
      bankAccountId: new UniqueEntityID(data.bankAccountId),
      costCenterId: new UniqueEntityID(data.costCenterId),
      name: data.name,
      administrator: data.administrator,
      groupNumber: data.groupNumber,
      quotaNumber: data.quotaNumber,
      contractNumber: data.contractNumber,
      creditValue: data.creditValue,
      monthlyPayment: data.monthlyPayment,
      totalInstallments: data.totalInstallments,
      paidInstallments: data.paidInstallments ?? 0,
      isContemplated: data.isContemplated ?? false,
      startDate: data.startDate,
      endDate: data.endDate,
      paymentDay: data.paymentDay,
      notes: data.notes,
      metadata: data.metadata ?? {},
    });

    this.items.push(consortium);
    return consortium;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<Consortium | null> {
    const item = this.items.find(
      (i) =>
        !i.deletedAt && i.id.equals(id) && i.tenantId.toString() === tenantId,
    );
    return item ?? null;
  }

  async findMany(
    options: FindManyConsortiaOptions,
  ): Promise<FindManyConsortiaResult> {
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
      if (options.status && i.status !== options.status) return false;
      if (
        options.isContemplated !== undefined &&
        i.isContemplated !== options.isContemplated
      )
        return false;

      if (options.search) {
        const term = options.search.toLowerCase();
        const matchesName = i.name.toLowerCase().includes(term);
        const matchesAdmin = i.administrator.toLowerCase().includes(term);
        const matchesContract =
          i.contractNumber?.toLowerCase().includes(term) ?? false;
        if (!matchesName && !matchesAdmin && !matchesContract) return false;
      }

      return true;
    });

    const total = filtered.length;
    const start = (page - 1) * limit;
    const consortia = filtered.slice(start, start + limit);

    return { consortia, total };
  }

  async update(data: UpdateConsortiumSchema): Promise<Consortium | null> {
    const item = this.items.find((i) => !i.deletedAt && i.id.equals(data.id));
    if (!item) return null;

    if (data.name !== undefined) item.name = data.name;
    if (data.administrator !== undefined)
      item.administrator = data.administrator;
    if (data.contractNumber !== undefined)
      item.contractNumber = data.contractNumber ?? undefined;
    if (data.status !== undefined) item.status = data.status;
    if (data.paidInstallments !== undefined)
      item.paidInstallments = data.paidInstallments;
    if (data.isContemplated !== undefined)
      item.isContemplated = data.isContemplated;
    if (data.contemplatedAt !== undefined)
      item.contemplatedAt = data.contemplatedAt ?? undefined;
    if (data.contemplationType !== undefined)
      item.contemplationType = data.contemplationType ?? undefined;
    if (data.notes !== undefined) item.notes = data.notes ?? undefined;
    if (data.endDate !== undefined) item.endDate = data.endDate ?? undefined;

    return item;
  }

  async delete(id: UniqueEntityID): Promise<void> {
    const item = this.items.find((i) => !i.deletedAt && i.id.equals(id));
    if (item) item.delete();
  }
}
