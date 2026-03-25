import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { StoreCredit } from '@/entities/sales/store-credit';

export interface FindManyStoreCreditsParams {
  page: number;
  limit: number;
  customerId?: string;
}

export interface FindManyStoreCreditsResult {
  data: StoreCredit[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface StoreCreditsRepository {
  create(credit: StoreCredit): Promise<void>;
  findById(id: UniqueEntityID, tenantId: string): Promise<StoreCredit | null>;
  findByCustomer(
    customerId: UniqueEntityID,
    tenantId: string,
    activeOnly?: boolean,
  ): Promise<StoreCredit[]>;
  findManyPaginated(
    tenantId: string,
    params: FindManyStoreCreditsParams,
  ): Promise<FindManyStoreCreditsResult>;
  getBalance(customerId: UniqueEntityID, tenantId: string): Promise<number>;
  save(credit: StoreCredit): Promise<void>;
  delete(id: UniqueEntityID, tenantId: string): Promise<void>;
}
