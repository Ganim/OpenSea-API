import type { PixCharge } from '@/entities/cashier/pix-charge';
import type { PixChargesRepository } from '../pix-charges-repository';

export class InMemoryPixChargesRepository implements PixChargesRepository {
  public items: PixCharge[] = [];

  async findById(id: string): Promise<PixCharge | null> {
    const charge = this.items.find(
      (item) => item.pixChargeId.toString() === id,
    );
    return charge ?? null;
  }

  async findByTxId(txId: string): Promise<PixCharge | null> {
    const charge = this.items.find((item) => item.txId === txId);
    return charge ?? null;
  }

  async findByTenantId(
    tenantId: string,
    params: { page: number; limit: number; status?: string },
  ): Promise<{ charges: PixCharge[]; total: number }> {
    let filteredCharges = this.items.filter(
      (item) => item.tenantId === tenantId,
    );

    if (params.status) {
      filteredCharges = filteredCharges.filter(
        (item) => item.status === params.status,
      );
    }

    const total = filteredCharges.length;
    const startIndex = (params.page - 1) * params.limit;
    const paginatedCharges = filteredCharges.slice(
      startIndex,
      startIndex + params.limit,
    );

    return { charges: paginatedCharges, total };
  }

  async create(charge: PixCharge): Promise<void> {
    this.items.push(charge);
  }

  async save(charge: PixCharge): Promise<void> {
    const existingIndex = this.items.findIndex((item) =>
      item.pixChargeId.equals(charge.pixChargeId),
    );

    if (existingIndex !== -1) {
      this.items[existingIndex] = charge;
    }
  }
}
