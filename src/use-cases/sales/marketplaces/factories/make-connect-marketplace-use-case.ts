import { PrismaMarketplaceConnectionsRepository } from '@/repositories/sales/prisma/prisma-marketplace-connections-repository';
import { makeMarketplaceAdapter } from '@/services/marketplace/marketplace-adapter-factory';
import type { MarketplaceType } from '@/entities/sales/marketplace-connection';
import { ConnectMarketplaceUseCase } from '../connect-marketplace';

export function makeConnectMarketplaceUseCase() {
  const connectionsRepository = new PrismaMarketplaceConnectionsRepository();

  return new ConnectMarketplaceUseCase(
    connectionsRepository,
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
