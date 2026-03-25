import type { MarketplaceType } from '@/entities/sales/marketplace-connection';
import { PrismaMarketplaceConnectionsRepository } from '@/repositories/sales/prisma/prisma-marketplace-connections-repository';
import { PrismaMarketplaceOrdersRepository } from '@/repositories/sales/prisma/prisma-marketplace-orders-repository';
import { makeMarketplaceAdapter } from '@/services/marketplace/marketplace-adapter-factory';
import { ImportMarketplaceOrdersUseCase } from '../import-marketplace-orders';

export function makeImportMarketplaceOrdersUseCase() {
  const connectionsRepository = new PrismaMarketplaceConnectionsRepository();
  const ordersRepository = new PrismaMarketplaceOrdersRepository();

  return new ImportMarketplaceOrdersUseCase(
    connectionsRepository,
    ordersRepository,
    (platform: MarketplaceType) => {
      const appId = process.env.ML_APP_ID ?? '';
      const appSecret = process.env.ML_APP_SECRET ?? '';
      const partnerId = Number(process.env.SHOPEE_PARTNER_ID ?? '0');
      const partnerKey = process.env.SHOPEE_PARTNER_KEY ?? '';

      return makeMarketplaceAdapter(platform, {
        appId,
        appSecret,
        partnerId,
        partnerKey,
      });
    },
  );
}
