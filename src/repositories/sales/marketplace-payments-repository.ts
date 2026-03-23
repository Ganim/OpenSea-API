import type { MarketplacePayment } from '@/entities/sales/marketplace-payment';

export interface MarketplacePaymentsRepository {
  findManyByConnection(
    connectionId: string,
    page: number,
    perPage: number,
    tenantId: string,
  ): Promise<MarketplacePayment[]>;
  findManyByTenant(
    page: number,
    perPage: number,
    tenantId: string,
  ): Promise<MarketplacePayment[]>;
  countByConnection(connectionId: string, tenantId: string): Promise<number>;
  countByTenant(tenantId: string): Promise<number>;
  getReconciliation(
    connectionId: string,
    tenantId: string,
  ): Promise<{
    totalGross: number;
    totalFees: number;
    totalNet: number;
    pendingCount: number;
    settledCount: number;
  }>;
}
