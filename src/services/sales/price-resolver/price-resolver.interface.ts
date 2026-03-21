export interface PriceResolverInput {
  tenantId: string;
  variantId: string;
  customerId?: string;
  quantity: number;
  channel?: 'PDV' | 'MARKETPLACE' | 'WHATSAPP' | 'WEB' | 'BID';
  destinationState?: string;
  couponCode?: string;
}

export type PriceSource =
  | 'CUSTOMER'
  | 'CAMPAIGN'
  | 'COUPON'
  | 'QUANTITY_TIER'
  | 'TABLE'
  | 'DEFAULT';

export interface PriceDiscount {
  type: 'PERCENTAGE' | 'FIXED_VALUE';
  value: number;
  amount: number;
  source: 'CAMPAIGN' | 'COUPON' | 'COMBO';
  sourceId: string;
  sourceName: string;
}

export interface PriceMargin {
  costPrice: number;
  marginPercent: number;
  marginValue: number;
}

export interface PriceResolverOutput {
  basePrice: number;
  finalPrice: number;
  priceSource: PriceSource;
  priceTableId?: string;
  priceTableName?: string;
  discount?: PriceDiscount;
  margin?: PriceMargin;
}

export interface PriceResolverService {
  resolve(input: PriceResolverInput): Promise<PriceResolverOutput>;
}
