import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
  SupplierData,
  SuppliersRepository,
} from '@/repositories/stock/suppliers-repository';

/**
 * Minimal in-memory SuppliersRepository for testing.
 * The Supplier entity lives in Finance; this stub satisfies the
 * SuppliersRepository interface used by PurchaseOrder use cases.
 */
export class InMemorySuppliersRepository implements SuppliersRepository {
  public items: SupplierData[] = [];

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<SupplierData | null> {
    const supplier = this.items.find(
      (item) => item.id === id.toString() && item.tenantId === tenantId,
    );
    return supplier ?? null;
  }

  /** Helper to seed test data */
  async create(data: {
    tenantId: string;
    name: string;
    cnpj?: string | null;
    email?: string | null;
    phone?: string | null;
    isActive?: boolean;
  }): Promise<SupplierData> {
    const supplier: SupplierData = {
      id: new UniqueEntityID().toString(),
      tenantId: data.tenantId,
      name: data.name,
      cnpj: data.cnpj ?? null,
      email: data.email ?? null,
      phone: data.phone ?? null,
      isActive: data.isActive ?? true,
    };

    this.items.push(supplier);
    return supplier;
  }
}
