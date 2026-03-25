import type { MarketplaceType } from '@/entities/sales/marketplace-connection';
import { PrismaMarketplaceConnectionsRepository } from '@/repositories/sales/prisma/prisma-marketplace-connections-repository';
import { PrismaMarketplaceListingsRepository } from '@/repositories/sales/prisma/prisma-marketplace-listings-repository';
import { makeMarketplaceAdapter } from '@/services/marketplace/marketplace-adapter-factory';
import { SyncInventoryToMarketplaceUseCase } from '../sync-inventory-to-marketplace';

export function makeSyncInventoryToMarketplaceUseCase() {
  const connectionsRepository = new PrismaMarketplaceConnectionsRepository();
  const listingsRepository = new PrismaMarketplaceListingsRepository();

  return new SyncInventoryToMarketplaceUseCase(
    connectionsRepository,
    listingsRepository,
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
