export interface OAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  userId?: string;
}

export interface MarketplaceProduct {
  title: string;
  description: string;
  price: number;
  currency: string;
  quantity: number;
  categoryId: string;
  images: string[];
  attributes?: Record<string, string>;
  variants?: MarketplaceVariant[];
  sku?: string;
  gtin?: string;
}

export interface MarketplaceVariant {
  name: string;
  value: string;
  price?: number;
  quantity?: number;
  sku?: string;
}

export interface MarketplaceListingResult {
  externalId: string;
  permalink?: string;
  status: string;
}

export interface MarketplaceOrderDTO {
  externalOrderId: string;
  status: string;
  buyerName: string;
  buyerEmail?: string;
  buyerPhone?: string;
  items: MarketplaceOrderItem[];
  totalAmount: number;
  shippingCost: number;
  commission: number;
  paymentStatus: string;
  shippingStatus?: string;
  trackingNumber?: string;
  createdAt: Date;
}

export interface MarketplaceOrderItem {
  externalId: string;
  title: string;
  quantity: number;
  unitPrice: number;
  sku?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  hasMore: boolean;
  cursor?: string;
}

export interface MarketplaceAdapter {
  readonly platform: string;

  // OAuth
  getAuthUrl(redirectUri: string, state: string): string;
  exchangeCode(code: string, redirectUri: string): Promise<OAuthTokens>;
  refreshToken(refreshToken: string): Promise<OAuthTokens>;

  // Products
  createListing(
    tokens: OAuthTokens,
    product: MarketplaceProduct,
  ): Promise<MarketplaceListingResult>;
  updateListing(
    tokens: OAuthTokens,
    externalId: string,
    product: Partial<MarketplaceProduct>,
  ): Promise<void>;
  deleteListing(tokens: OAuthTokens, externalId: string): Promise<void>;

  // Orders
  fetchOrders(
    tokens: OAuthTokens,
    since: Date,
    cursor?: string,
  ): Promise<PaginatedResult<MarketplaceOrderDTO>>;
  getOrderDetail(
    tokens: OAuthTokens,
    externalOrderId: string,
  ): Promise<MarketplaceOrderDTO>;

  // Inventory
  updateStock(
    tokens: OAuthTokens,
    externalId: string,
    quantity: number,
  ): Promise<void>;

  // Webhooks
  verifyWebhookSignature?(
    payload: Buffer | string,
    signature: string,
    secret: string,
  ): boolean;
}
