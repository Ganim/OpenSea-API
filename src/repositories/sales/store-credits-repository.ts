import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { StoreCredit } from '@/entities/sales/store-credit';

export interface StoreCreditsRepository {
  create(credit: StoreCredit): Promise<void>;
  findById(id: UniqueEntityID, tenantId: string): Promise<StoreCredit | null>;
  findByCustomer(
    customerId: UniqueEntityID,
    tenantId: string,
    activeOnly?: boolean,
  ): Promise<StoreCredit[]>;
  getBalance(customerId: UniqueEntityID, tenantId: string): Promise<number>;
  save(credit: StoreCredit): Promise<void>;
}
