import type { PixCharge } from '@/entities/cashier/pix-charge';

export interface PixChargesRepository {
  findById(id: string): Promise<PixCharge | null>;
  findByTxId(txId: string): Promise<PixCharge | null>;
  findByTenantId(
    tenantId: string,
    params: { page: number; limit: number; status?: string },
  ): Promise<{ charges: PixCharge[]; total: number }>;
  create(charge: PixCharge): Promise<void>;
  save(charge: PixCharge): Promise<void>;
}
