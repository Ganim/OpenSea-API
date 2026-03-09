import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { FinanceEntryCostCenter } from '@/entities/finance/finance-entry-cost-center';
import type {
  FinanceEntryCostCentersRepository,
  CreateFinanceEntryCostCenterItem,
} from '../finance-entry-cost-centers-repository';

export class InMemoryFinanceEntryCostCentersRepository
  implements FinanceEntryCostCentersRepository
{
  public items: FinanceEntryCostCenter[] = [];

  async createMany(
    data: CreateFinanceEntryCostCenterItem[],
    _tx?: unknown,
  ): Promise<void> {
    for (const item of data) {
      const allocation = FinanceEntryCostCenter.create({
        entryId: new UniqueEntityID(item.entryId),
        costCenterId: new UniqueEntityID(item.costCenterId),
        percentage: item.percentage,
        amount: item.amount,
      });
      this.items.push(allocation);
    }
  }

  async findByEntryId(entryId: string): Promise<FinanceEntryCostCenter[]> {
    return this.items.filter((i) => i.entryId.toString() === entryId);
  }

  async deleteByEntryId(entryId: string, _tx?: unknown): Promise<void> {
    this.items = this.items.filter((i) => i.entryId.toString() !== entryId);
  }
}
