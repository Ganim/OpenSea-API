import type {
  MarketplaceAdapter,
  MarketplaceListingResult,
  MarketplaceOrderDTO,
  MarketplaceProduct,
  OAuthTokens,
  PaginatedResult,
} from '../marketplace-adapter.interface';

const ML_API_BASE = 'https://api.mercadolibre.com';
const ML_AUTH_URL = 'https://auth.mercadolivre.com.br/authorization';

interface MlApiPaging {
  total?: number;
  offset?: number;
  limit?: number;
}

interface MlApiOrderItem {
  item?: {
    id?: string;
    title?: string;
    seller_custom_field?: string;
  };
  quantity?: number;
  unit_price?: number;
}

interface MlApiOrder {
  id: number | string;
  status: string;
  buyer?: {
    nickname?: string;
    first_name?: string;
    email?: string;
    phone?: { number?: string };
  };
  order_items?: MlApiOrderItem[];
  total_amount?: number;
  shipping?: {
    cost?: number;
    status?: string;
    tracking_number?: string;
  };
  mediations?: Array<{
    payment?: { marketplace_fee?: number };
  }>;
  payments?: Array<{ status?: string }>;
  date_created?: string;
}

export class MercadoLivreAdapter implements MarketplaceAdapter {
  readonly platform = 'MERCADO_LIVRE';

  constructor(
    private readonly appId: string,
    private readonly appSecret: string,
  ) {}

  getAuthUrl(redirectUri: string, state: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.appId,
      redirect_uri: redirectUri,
      state,
    });
    return `${ML_AUTH_URL}?${params.toString()}`;
  }

  async exchangeCode(code: string, redirectUri: string): Promise<OAuthTokens> {
    const response = await fetch(`${ML_API_BASE}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: this.appId,
        client_secret: this.appSecret,
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const errorMessage =
        (errorBody as Record<string, string>).message || response.statusText;
      throw new Error(`ML OAuth error: ${errorMessage}`);
    }

    const tokenResponse = (await response.json()) as {
      access_token: string;
      refresh_token: string;
      expires_in: number;
      user_id: number;
    };

    return {
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token,
      expiresAt: new Date(Date.now() + tokenResponse.expires_in * 1000),
      userId: String(tokenResponse.user_id),
    };
  }

  async refreshToken(currentRefreshToken: string): Promise<OAuthTokens> {
    const response = await fetch(`${ML_API_BASE}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: this.appId,
        client_secret: this.appSecret,
        refresh_token: currentRefreshToken,
      }),
    });

    if (!response.ok) {
      throw new Error('ML token refresh failed');
    }

    const tokenResponse = (await response.json()) as {
      access_token: string;
      refresh_token: string;
      expires_in: number;
      user_id: number;
    };

    return {
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token,
      expiresAt: new Date(Date.now() + tokenResponse.expires_in * 1000),
      userId: String(tokenResponse.user_id),
    };
  }

  async createListing(
    tokens: OAuthTokens,
    product: MarketplaceProduct,
  ): Promise<MarketplaceListingResult> {
    const requestBody: Record<string, unknown> = {
      title: product.title,
      category_id: product.categoryId,
      price: product.price,
      currency_id: product.currency || 'BRL',
      available_quantity: product.quantity,
      buying_mode: 'buy_it_now',
      listing_type_id: 'gold_special',
      condition: 'new',
      description: { plain_text: product.description },
      pictures: product.images.map((url) => ({ source: url })),
    };

    if (product.sku) {
      requestBody.seller_custom_field = product.sku;
    }

    if (product.gtin) {
      requestBody.gtin = product.gtin;
    }

    if (product.attributes) {
      requestBody.attributes = Object.entries(product.attributes).map(
        ([attributeId, attributeValue]) => ({
          id: attributeId,
          value_name: attributeValue,
        }),
      );
    }

    const mlItemResponse = (await this.authenticatedRequest(
      tokens,
      'POST',
      '/items',
      requestBody,
    )) as {
      id: string;
      permalink?: string;
      status: string;
    };

    return {
      externalId: mlItemResponse.id,
      permalink: mlItemResponse.permalink,
      status: mlItemResponse.status,
    };
  }

  async updateListing(
    tokens: OAuthTokens,
    externalId: string,
    product: Partial<MarketplaceProduct>,
  ): Promise<void> {
    const updatePayload: Record<string, unknown> = {};

    if (product.title) {
      updatePayload.title = product.title;
    }

    if (product.price !== undefined) {
      updatePayload.price = product.price;
    }

    if (product.quantity !== undefined) {
      updatePayload.available_quantity = product.quantity;
    }

    if (product.images) {
      updatePayload.pictures = product.images.map((url) => ({ source: url }));
    }

    await this.authenticatedRequest(
      tokens,
      'PUT',
      `/items/${externalId}`,
      updatePayload,
    );
  }

  async deleteListing(tokens: OAuthTokens, externalId: string): Promise<void> {
    await this.authenticatedRequest(tokens, 'PUT', `/items/${externalId}`, {
      status: 'closed',
    });
  }

  async fetchOrders(
    tokens: OAuthTokens,
    since: Date,
    cursor?: string,
  ): Promise<PaginatedResult<MarketplaceOrderDTO>> {
    const queryParams: Record<string, string> = {
      seller: tokens.userId || '',
      'order.date_created.from': since.toISOString(),
      sort: 'date_desc',
      limit: '50',
    };

    if (cursor) {
      queryParams.offset = cursor;
    }

    const queryString = new URLSearchParams(queryParams).toString();
    const ordersResponse = (await this.authenticatedRequest(
      tokens,
      'GET',
      `/orders/search?${queryString}`,
    )) as {
      results?: MlApiOrder[];
      paging?: MlApiPaging;
    };

    const currentOffset = ordersResponse.paging?.offset ?? 0;
    const pageLimit = ordersResponse.paging?.limit ?? 50;
    const totalOrders = ordersResponse.paging?.total ?? 0;

    return {
      data: (ordersResponse.results ?? []).map((rawOrder) =>
        this.mapMlOrderToDTO(rawOrder),
      ),
      total: totalOrders,
      hasMore: currentOffset + pageLimit < totalOrders,
      cursor: String(currentOffset + pageLimit),
    };
  }

  async getOrderDetail(
    tokens: OAuthTokens,
    externalOrderId: string,
  ): Promise<MarketplaceOrderDTO> {
    const rawOrder = (await this.authenticatedRequest(
      tokens,
      'GET',
      `/orders/${externalOrderId}`,
    )) as MlApiOrder;

    return this.mapMlOrderToDTO(rawOrder);
  }

  async updateStock(
    tokens: OAuthTokens,
    externalId: string,
    quantity: number,
  ): Promise<void> {
    await this.authenticatedRequest(tokens, 'PUT', `/items/${externalId}`, {
      available_quantity: quantity,
    });
  }

  verifyWebhookSignature(): boolean {
    // ML webhooks are verified by fetching the resource, not by signature
    return true;
  }

  private async authenticatedRequest(
    tokens: OAuthTokens,
    method: string,
    path: string,
    body?: unknown,
  ): Promise<unknown> {
    const url = path.startsWith('http') ? path : `${ML_API_BASE}${path}`;

    const requestOptions: RequestInit = {
      method,
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    };

    if (body && method !== 'GET') {
      requestOptions.body = JSON.stringify(body);
    }

    const response = await fetch(url, requestOptions);

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const errorMessage =
        (errorBody as Record<string, string>).message || response.statusText;
      throw new Error(`ML API Error ${response.status}: ${errorMessage}`);
    }

    return response.json();
  }

  private mapMlOrderToDTO(rawOrder: MlApiOrder): MarketplaceOrderDTO {
    return {
      externalOrderId: String(rawOrder.id),
      status: rawOrder.status,
      buyerName:
        rawOrder.buyer?.nickname || rawOrder.buyer?.first_name || 'Unknown',
      buyerEmail: rawOrder.buyer?.email,
      buyerPhone: rawOrder.buyer?.phone?.number,
      items: (rawOrder.order_items ?? []).map((orderItem) => ({
        externalId: String(orderItem.item?.id ?? ''),
        title: orderItem.item?.title ?? '',
        quantity: orderItem.quantity ?? 0,
        unitPrice: orderItem.unit_price ?? 0,
        sku: orderItem.item?.seller_custom_field,
      })),
      totalAmount: rawOrder.total_amount ?? 0,
      shippingCost: rawOrder.shipping?.cost ?? 0,
      commission: rawOrder.mediations?.[0]?.payment?.marketplace_fee ?? 0,
      paymentStatus: rawOrder.payments?.[0]?.status ?? 'unknown',
      shippingStatus: rawOrder.shipping?.status,
      trackingNumber: rawOrder.shipping?.tracking_number,
      createdAt: new Date(rawOrder.date_created ?? Date.now()),
    };
  }
}
