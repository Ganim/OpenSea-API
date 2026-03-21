import { PrismaMarketplaceConnectionsRepository } from '@/repositories/sales/prisma/prisma-marketplace-connections-repository';
import { PrismaMarketplacePaymentsRepository } from '@/repositories/sales/prisma/prisma-marketplace-payments-repository';
import { GetMarketplaceReconciliationUseCase } from '../get-marketplace-reconciliation';

export function makeGetMarketplaceReconciliationUseCase() {
  const connectionsRepository = new PrismaMarketplaceConnectionsRepository();
  const paymentsRepository = new PrismaMarketplacePaymentsRepository();
  return new GetMarketplaceReconciliationUseCase(
    connectionsRepository,
    paymentsRepository,
  );
}
