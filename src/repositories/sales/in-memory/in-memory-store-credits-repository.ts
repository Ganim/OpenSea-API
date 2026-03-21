import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { StoreCredit } from '@/entities/sales/store-credit';
import type { StoreCreditsRepository } from '@/repositories/sales/store-credits-repository';

export class InMemoryStoreCreditsRepository implements StoreCreditsRepository {
  public items: StoreCredit[] = [];

  async create(credit: StoreCredit): Promise<void> {
    this.items.push(credit);
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<StoreCredit | null> {
    return (
      this.items.find(
        (c) =>
          c.id.toString() === id.toString() &&
          c.tenantId.toString() === tenantId,
      ) ?? null
    );
  }

  async findByCustomer(
    customerId: UniqueEntityID,
    tenantId: string,
    activeOnly = true,
  ): Promise<StoreCredit[]> {
    return this.items.filter(
      (c) =>
        c.customerId.toString() === customerId.toString() &&
        c.tenantId.toString() === tenantId &&
        (!activeOnly || (c.isActive && !c.isExpired)),
    );
  }

  async getBalance(
    customerId: UniqueEntityID,
    tenantId: string,
  ): Promise<number> {
    const credits = await this.findByCustomer(customerId, tenantId, true);
    return credits.reduce((sum, c) => sum + c.availableBalance, 0);
  }

  async save(credit: StoreCredit): Promise<void> {
    const index = this.items.findIndex(
      (c) => c.id.toString() === credit.id.toString(),
    );
    if (index !== -1) {
      this.items[index] = credit;
    }
  }
}
