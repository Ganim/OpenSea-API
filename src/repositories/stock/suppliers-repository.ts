import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';

/**
 * Minimal Supplier interface used by product and purchase-order use cases.
 * Supplier entity does not have a formal domain class yet — returns raw data.
 */
export interface SupplierData {
  id: string;
  tenantId: string;
  name: string;
  cnpj: string | null;
  email: string | null;
  phone: string | null;
  isActive: boolean;
}

export interface SuppliersRepository {
  findById(id: UniqueEntityID, tenantId: string): Promise<SupplierData | null>;
}
