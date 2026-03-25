import { createHmac } from 'node:crypto';

import type {
  MarketplaceAdapter,
  MarketplaceListingResult,
  MarketplaceOrderDTO,
  MarketplaceProduct,
  OAuthTokens,
  PaginatedResult,
} from '../marketplace-adapter.interface';

const SHOPEE_API_BASE = 'https://partner.shopeemobile.com/api/v2';
const SHOPEE_AUTH_HOST = 'https://partner.shopeemobile.com';

interface ShopeeOrderItem {
  item_id?: number;
  item_name?: string;
  model_quantity_purchased?: number;
  model_discounted_price?: number;
  model_sku?: string;
}

interface ShopeeOrderDetail {
  order_sn: string;
  order_status: string;
  buyer_username?: string;
  buyer_user_id?: number;
  item_list?: ShopeeOrderItem[];
  total_amount?: number;
  estimated_shipping_fee?: number;
  actual_shipping_fee?: number;
  service_fee?: number;
  commission_fee?: number;
  payment_method?: string;
  shipping_carrier?: string;
  tracking_no?: string;
  create_time?: number;
}

export class ShopeeAdapter implements MarketplaceAdapter {
  readonly platform = 'SHOPEE';

  constructor(
    private readonly partnerId: number,
    private readonly partnerKey: string,
  ) {}

  getAuthUrl(redirectUri: string, state: string): string {
    const timestamp = Math.floor(Date.now() / 1000);
    const path = '/api/v2/shop/auth_partner';
    const baseString = `${this.partnerId}${path}${timestamp}`;
    const signature = this.generateSignature(baseString);

    const params = new URLSearchParams({
      partner_id: String(this.partnerId),
      timestamp: String(timestamp),
      sign: signature,
      redirect: redirectUri,
      state,
    });

    return `${SHOPEE_AUTH_HOST}${path}?${params.toString()}`;
  }

  async exchangeCode(code: string, _redirectUri: string): Promise<OAuthTokens> {
    const shopId = this.extractShopIdFromCode(code);

    const tokenResponse = (await this.signedRequest('POST', '/auth/token/get', {
      code,
      partner_id: this.partnerId,
      shop_id: shopId,
    })) as {
      access_token: string;
      refresh_token: string;
      expire_in: number;
      shop_id: number;
    };

    return {
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token,
      expiresAt: new Date(Date.now() + tokenResponse.expire_in * 1000),
      userId: String(tokenResponse.shop_id),
    };
  }

  async refreshToken(currentRefreshToken: string): Promise<OAuthTokens> {
    const tokenResponse = (await this.signedRequest(
      'POST',
      '/auth/access_token/get',
      {
        refresh_token: currentRefreshToken,
        partner_id: this.partnerId,
        shop_id: 0,
      },
    )) as {
      access_token: string;
      refresh_token: string;
      expire_in: number;
      shop_id: number;
    };

    return {
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token,
      expiresAt: new Date(Date.now() + tokenResponse.expire_in * 1000),
      userId: String(tokenResponse.shop_id),
    };
  }

  async createListing(
    tokens: OAuthTokens,
    product: MarketplaceProduct,
  ): Promise<MarketplaceListingResult> {
    const shopId = Number(tokens.userId);

    const addItemBody: Record<string, unknown> = {
      original_price: product.price,
      description: product.description,
      item_name: product.title,
      normal_stock: product.quantity,
      category_id: Number(product.categoryId),
      image: { image_url_list: product.images },
      item_sku: product.sku,
    };

    if (product.attributes) {
      addItemBody.attribute_list = Object.entries(product.attributes).map(
        ([attributeId, attributeValue]) => ({
          attribute_id: Number(attributeId),
          attribute_value_list: [
            { value_id: 0, original_value_name: attributeValue },
          ],
        }),
      );
    }

    if (product.variants && product.variants.length > 0) {
      addItemBody.tier_variation = product.variants.map((variant) => ({
        name: variant.name,
        option_list: [{ option: variant.value }],
      }));
    }

    const addItemResponse = (await this.authenticatedRequest(
      tokens,
      'POST',
      '/product/add_item',
      addItemBody,
      shopId,
    )) as {
      response?: { item_id?: number };
    };

    const itemId = String(addItemResponse.response?.item_id ?? '');

    return {
      externalId: itemId,
      status: 'NORMAL',
    };
  }

  async updateListing(
    tokens: OAuthTokens,
    externalId: string,
    product: Partial<MarketplaceProduct>,
  ): Promise<void> {
    const shopId = Number(tokens.userId);

    const updatePayload: Record<string, unknown> = {
      item_id: Number(externalId),
    };

    if (product.title) {
      updatePayload.item_name = product.title;
    }

    if (product.description) {
      updatePayload.description = product.description;
    }

    if (product.price !== undefined) {
      updatePayload.original_price = product.price;
    }

    if (product.images) {
      updatePayload.image = { image_url_list: product.images };
    }

    await this.authenticatedRequest(
      tokens,
      'POST',
      '/product/update_item',
      updatePayload,
      shopId,
    );
  }

  async deleteListing(tokens: OAuthTokens, externalId: string): Promise<void> {
    const shopId = Number(tokens.userId);

    await this.authenticatedRequest(
      tokens,
      'POST',
      '/product/delete_item',
      { item_id_list: [Number(externalId)] },
      shopId,
    );
  }

  async fetchOrders(
    tokens: OAuthTokens,
    since: Date,
    cursor?: string,
  ): Promise<PaginatedResult<MarketplaceOrderDTO>> {
    const shopId = Number(tokens.userId);
    const timeFrom = Math.floor(since.getTime() / 1000);
    const timeTo = Math.floor(Date.now() / 1000);

    const orderListBody: Record<string, unknown> = {
      time_range_field: 'create_time',
      time_from: timeFrom,
      time_to: timeTo,
      page_size: 50,
      cursor: cursor || '',
      order_status: 'ALL',
    };

    const orderListResponse = (await this.authenticatedRequest(
      tokens,
      'GET',
      '/order/get_order_list',
      orderListBody,
      shopId,
    )) as {
      response?: {
        order_list?: Array<{ order_sn: string }>;
        more?: boolean;
        next_cursor?: string;
        total_count?: number;
      };
    };

    const orderSnList =
      orderListResponse.response?.order_list?.map(
        (orderSummary) => orderSummary.order_sn,
      ) ?? [];

    if (orderSnList.length === 0) {
      return { data: [], total: 0, hasMore: false };
    }

    const orderDetailResponse = (await this.authenticatedRequest(
      tokens,
      'GET',
      '/order/get_order_detail',
      {
        order_sn_list: orderSnList.join(','),
        response_optional_fields:
          'buyer_username,item_list,pay_time,total_amount,shipping_carrier,tracking_no',
      },
      shopId,
    )) as {
      response?: { order_list?: ShopeeOrderDetail[] };
    };

    const detailedOrders = (orderDetailResponse.response?.order_list ?? []).map(
      (orderDetail) => this.mapShopeeOrderToDTO(orderDetail),
    );

    return {
      data: detailedOrders,
      total: orderListResponse.response?.total_count ?? detailedOrders.length,
      hasMore: orderListResponse.response?.more ?? false,
      cursor: orderListResponse.response?.next_cursor,
    };
  }

  async getOrderDetail(
    tokens: OAuthTokens,
    externalOrderId: string,
  ): Promise<MarketplaceOrderDTO> {
    const shopId = Number(tokens.userId);

    const orderDetailResponse = (await this.authenticatedRequest(
      tokens,
      'GET',
      '/order/get_order_detail',
      {
        order_sn_list: externalOrderId,
        response_optional_fields:
          'buyer_username,item_list,pay_time,total_amount,shipping_carrier,tracking_no',
      },
      shopId,
    )) as {
      response?: { order_list?: ShopeeOrderDetail[] };
    };

    const orderDetail = orderDetailResponse.response?.order_list?.[0];

    if (!orderDetail) {
      throw new Error(`Shopee order not found: ${externalOrderId}`);
    }

    return this.mapShopeeOrderToDTO(orderDetail);
  }

  async updateStock(
    tokens: OAuthTokens,
    externalId: string,
    quantity: number,
  ): Promise<void> {
    const shopId = Number(tokens.userId);

    await this.authenticatedRequest(
      tokens,
      'POST',
      '/product/update_stock',
      {
        item_id: Number(externalId),
        stock_list: [
          {
            model_id: 0,
            normal_stock: quantity,
          },
        ],
      },
      shopId,
    );
  }

  verifyWebhookSignature(
    payload: Buffer | string,
    signature: string,
    _secret: string,
  ): boolean {
    const payloadString =
      typeof payload === 'string' ? payload : payload.toString('utf-8');

    const computedSignature = this.generateSignature(payloadString);

    return computedSignature === signature;
  }

  private generateSignature(baseString: string): string {
    return createHmac('sha256', this.partnerKey)
      .update(baseString)
      .digest('hex');
  }

  private buildSignedUrl(
    path: string,
    accessToken?: string,
    shopId?: number,
  ): string {
    const timestamp = Math.floor(Date.now() / 1000);
    let baseString = `${this.partnerId}${path}${timestamp}`;

    if (accessToken) {
      baseString += accessToken;
    }

    if (shopId) {
      baseString += shopId;
    }

    const signature = this.generateSignature(baseString);

    const params = new URLSearchParams({
      partner_id: String(this.partnerId),
      timestamp: String(timestamp),
      sign: signature,
    });

    if (accessToken) {
      params.set('access_token', accessToken);
    }

    if (shopId) {
      params.set('shop_id', String(shopId));
    }

    return `${SHOPEE_API_BASE}${path}?${params.toString()}`;
  }

  private async signedRequest(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<unknown> {
    const url = this.buildSignedUrl(path);

    const requestOptions: RequestInit = {
      method,
      headers: {
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
      throw new Error(`Shopee API Error ${response.status}: ${errorMessage}`);
    }

    const responseBody = (await response.json()) as {
      error?: string;
      message?: string;
    };

    if (responseBody.error) {
      throw new Error(
        `Shopee API Error: ${responseBody.error} - ${responseBody.message}`,
      );
    }

    return responseBody;
  }

  private async authenticatedRequest(
    tokens: OAuthTokens,
    method: string,
    path: string,
    body?: unknown,
    shopId?: number,
  ): Promise<unknown> {
    const url = this.buildSignedUrl(path, tokens.accessToken, shopId);

    const requestOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    };

    if (body && method === 'GET') {
      // For Shopee GET requests, params go in query string
      const queryParams = new URLSearchParams();
      for (const [key, value] of Object.entries(
        body as Record<string, unknown>,
      )) {
        queryParams.set(key, String(value));
      }
      const separator = url.includes('?') ? '&' : '?';
      const fullUrl = `${url}${separator}${queryParams.toString()}`;

      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      return this.handleShopeeResponse(response);
    }

    if (body && method !== 'GET') {
      requestOptions.body = JSON.stringify(body);
    }

    const response = await fetch(url, requestOptions);
    return this.handleShopeeResponse(response);
  }

  private async handleShopeeResponse(response: Response): Promise<unknown> {
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const errorMessage =
        (errorBody as Record<string, string>).message || response.statusText;
      throw new Error(`Shopee API Error ${response.status}: ${errorMessage}`);
    }

    const responseBody = (await response.json()) as {
      error?: string;
      message?: string;
    };

    if (responseBody.error && responseBody.error !== '') {
      throw new Error(
        `Shopee API Error: ${responseBody.error} - ${responseBody.message}`,
      );
    }

    return responseBody;
  }

  private extractShopIdFromCode(code: string): number {
    // Shopee returns shop_id as part of the auth callback; if embedded in code, parse it
    const numericShopId = Number(code.split(':')[1]);
    return Number.isNaN(numericShopId) ? 0 : numericShopId;
  }

  private mapShopeeOrderToDTO(
    orderDetail: ShopeeOrderDetail,
  ): MarketplaceOrderDTO {
    const totalAmount = orderDetail.total_amount ?? 0;
    const shippingCost =
      orderDetail.actual_shipping_fee ??
      orderDetail.estimated_shipping_fee ??
      0;
    const commission =
      (orderDetail.commission_fee ?? 0) + (orderDetail.service_fee ?? 0);

    return {
      externalOrderId: orderDetail.order_sn,
      status: orderDetail.order_status,
      buyerName: orderDetail.buyer_username ?? 'Unknown',
      items: (orderDetail.item_list ?? []).map((shopeeItem) => ({
        externalId: String(shopeeItem.item_id ?? ''),
        title: shopeeItem.item_name ?? '',
        quantity: shopeeItem.model_quantity_purchased ?? 0,
        unitPrice: shopeeItem.model_discounted_price ?? 0,
        sku: shopeeItem.model_sku,
      })),
      totalAmount,
      shippingCost,
      commission,
      paymentStatus: orderDetail.payment_method ?? 'unknown',
      shippingStatus: orderDetail.shipping_carrier,
      trackingNumber: orderDetail.tracking_no,
      createdAt: orderDetail.create_time
        ? new Date(orderDetail.create_time * 1000)
        : new Date(),
    };
  }
}
