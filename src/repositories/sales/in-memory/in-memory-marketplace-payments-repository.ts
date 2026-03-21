import { MarketplacePayment } from '@/entities/sales/marketplace-payment';
import type { MarketplacePaymentsRepository } from '../marketplace-payments-repository';

export class InMemoryMarketplacePaymentsRepository
  implements MarketplacePaymentsRepository
{
  public items: MarketplacePayment[] = [];

  async findManyByConnection(
    connectionId: string,
    page: number,
    perPage: number,
    tenantId: string,
  ): Promise<MarketplacePayment[]> {
    const start = (page - 1) * perPage;
    return this.items
      .filter(
        (p) =>
          p.connectionId.toString() === connectionId &&
          p.tenantId.toString() === tenantId,
      )
      .slice(start, start + perPage);
  }

  async findManyByTenant(
    page: number,
    perPage: number,
    tenantId: string,
  ): Promise<MarketplacePayment[]> {
    const start = (page - 1) * perPage;
    return this.items
      .filter((p) => p.tenantId.toString() === tenantId)
      .slice(start, start + perPage);
  }

  async countByConnection(
    connectionId: string,
    tenantId: string,
  ): Promise<number> {
    return this.items.filter(
      (p) =>
        p.connectionId.toString() === connectionId &&
        p.tenantId.toString() === tenantId,
    ).length;
  }

  async countByTenant(tenantId: string): Promise<number> {
    return this.items.filter((p) => p.tenantId.toString() === tenantId).length;
  }

  async getReconciliation(
    connectionId: string,
    tenantId: string,
  ): Promise<{
    totalGross: number;
    totalFees: number;
    totalNet: number;
    pendingCount: number;
    settledCount: number;
  }> {
    const payments = this.items.filter(
      (p) =>
        p.connectionId.toString() === connectionId &&
        p.tenantId.toString() === tenantId,
    );

    return {
      totalGross: payments.reduce((sum, p) => sum + p.grossAmount, 0),
      totalFees: payments.reduce((sum, p) => sum + p.feeAmount, 0),
      totalNet: payments.reduce((sum, p) => sum + p.netAmount, 0),
      pendingCount: payments.filter((p) => p.status === 'PENDING').length,
      settledCount: payments.filter((p) => p.status === 'SETTLED').length,
    };
  }
}
