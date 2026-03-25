import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { StoreCredit } from '@/entities/sales/store-credit';
import type {
  FindManyStoreCreditsParams,
  FindManyStoreCreditsResult,
  StoreCreditsRepository,
} from '@/repositories/sales/store-credits-repository';

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

  async findManyPaginated(
    tenantId: string,
    params: FindManyStoreCreditsParams,
  ): Promise<FindManyStoreCreditsResult> {
    const { page, limit, customerId } = params;

    let filtered = this.items.filter((c) => c.tenantId.toString() === tenantId);

    if (customerId) {
      filtered = filtered.filter((c) => c.customerId.toString() === customerId);
    }

    // Sort by createdAt descending
    filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = filtered.length;
    const start = (page - 1) * limit;
    const paginated = filtered.slice(start, start + limit);

    return {
      data: paginated,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
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

  async delete(id: UniqueEntityID, tenantId: string): Promise<void> {
    this.items = this.items.filter(
      (c) =>
        !(
          c.id.toString() === id.toString() &&
          c.tenantId.toString() === tenantId
        ),
    );
  }
}
