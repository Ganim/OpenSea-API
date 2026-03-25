import type { MarketplaceAdapter } from './marketplace-adapter.interface';
import { MercadoLivreAdapter } from './mercado-livre/ml-adapter';
import { ShopeeAdapter } from './shopee/shopee-adapter';

export interface MarketplaceAdapterConfig {
  appId: string;
  appSecret: string;
  partnerId?: number;
  partnerKey?: string;
}

export function makeMarketplaceAdapter(
  platform: string,
  config: MarketplaceAdapterConfig,
): MarketplaceAdapter {
  switch (platform) {
    case 'MERCADO_LIVRE':
      return new MercadoLivreAdapter(config.appId, config.appSecret);
    case 'SHOPEE': {
      if (!config.partnerId || !config.partnerKey) {
        throw new Error(
          'Shopee adapter requires partnerId and partnerKey in config.',
        );
      }
      return new ShopeeAdapter(config.partnerId, config.partnerKey);
    }
    default:
      throw new Error(`Unsupported marketplace platform: ${platform}`);
  }
}
