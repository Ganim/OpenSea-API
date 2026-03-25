export type {
  MarketplaceAdapter,
  MarketplaceListingResult,
  MarketplaceOrderDTO,
  MarketplaceOrderItem,
  MarketplaceProduct,
  MarketplaceVariant,
  OAuthTokens,
  PaginatedResult,
} from './marketplace-adapter.interface';
export {
  makeMarketplaceAdapter,
  type MarketplaceAdapterConfig,
} from './marketplace-adapter-factory';
export { MercadoLivreAdapter } from './mercado-livre/ml-adapter';
export { ShopeeAdapter } from './shopee/shopee-adapter';
