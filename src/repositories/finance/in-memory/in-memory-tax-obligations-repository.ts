import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { TaxObligation } from '@/entities/finance/tax-obligation';
import type {
  CreateTaxObligationSchema,
  FindManyTaxObligationsOptions,
  FindManyTaxObligationsResult,
  TaxObligationsRepository,
} from '../tax-obligations-repository';

export class InMemoryTaxObligationsRepository
  implements TaxObligationsRepository
{
  public items: TaxObligation[] = [];

  async create(data: CreateTaxObligationSchema): Promise<TaxObligation> {
    const obligation = TaxObligation.create({
      tenantId: new UniqueEntityID(data.tenantId),
      taxType: data.taxType,
      referenceMonth: data.referenceMonth,
      referenceYear: data.referenceYear,
      dueDate: data.dueDate,
      amount: data.amount,
      darfCode: data.darfCode,
    });

    this.items.push(obligation);
    return obligation;
  }

  async createMany(
    data: CreateTaxObligationSchema[],
  ): Promise<TaxObligation[]> {
    const obligations: TaxObligation[] = [];

    for (const obligationData of data) {
      const obligation = await this.create(obligationData);
      obligations.push(obligation);
    }

    return obligations;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<TaxObligation | null> {
    const obligation = this.items.find(
      (o) =>
        o.id.toString() === id.toString() && o.tenantId.toString() === tenantId,
    );
    return obligation ?? null;
  }

  async findByTaxTypeAndPeriod(
    tenantId: string,
    taxType: string,
    referenceMonth: number,
    referenceYear: number,
  ): Promise<TaxObligation | null> {
    const obligation = this.items.find(
      (o) =>
        o.tenantId.toString() === tenantId &&
        o.taxType === taxType &&
        o.referenceMonth === referenceMonth &&
        o.referenceYear === referenceYear,
    );
    return obligation ?? null;
  }

  async findMany(
    options: FindManyTaxObligationsOptions,
  ): Promise<FindManyTaxObligationsResult> {
    let filtered = this.items.filter(
      (o) => o.tenantId.toString() === options.tenantId,
    );

    if (options.year !== undefined) {
      filtered = filtered.filter((o) => o.referenceYear === options.year);
    }
    if (options.month !== undefined) {
      filtered = filtered.filter((o) => o.referenceMonth === options.month);
    }
    if (options.status) {
      filtered = filtered.filter((o) => o.status === options.status);
    }
    if (options.taxType) {
      filtered = filtered.filter((o) => o.taxType === options.taxType);
    }

    const total = filtered.length;
    const page = options.page ?? 1;
    const limit = options.limit ?? 20;
    const offset = (page - 1) * limit;
    const obligations = filtered
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
      .slice(offset, offset + limit);

    return { obligations, total };
  }

  async update(obligation: TaxObligation): Promise<void> {
    const index = this.items.findIndex(
      (o) => o.id.toString() === obligation.id.toString(),
    );
    if (index >= 0) {
      this.items[index] = obligation;
    }
  }

  async delete(id: UniqueEntityID, tenantId: string): Promise<void> {
    this.items = this.items.filter(
      (o) =>
        !(
          o.id.toString() === id.toString() &&
          o.tenantId.toString() === tenantId
        ),
    );
  }

  async sumPendingByYear(tenantId: string, year: number): Promise<number> {
    return this.items
      .filter(
        (o) =>
          o.tenantId.toString() === tenantId &&
          o.referenceYear === year &&
          o.status === 'PENDING',
      )
      .reduce((sum, o) => sum + o.amount, 0);
  }
}
