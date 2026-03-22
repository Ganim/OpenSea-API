/**
 * Sales module event type definitions.
 *
 * Each event constant follows the `{module}.{entity}.{action}` naming convention.
 * Data interfaces define the typed payload for each event.
 */

// ─── Event Type Constants ────────────────────────────────────────────────────

export const SALES_EVENTS = {
  // CRM / Deals
  DEAL_CREATED: 'sales.deal.created',
  DEAL_WON: 'sales.deal.won',
  DEAL_LOST: 'sales.deal.lost',
  CONTACT_CREATED: 'sales.contact.created',
  STAGE_CHANGED: 'sales.stage.changed',

  // Orders
  ORDER_CONFIRMED: 'sales.order.confirmed',
  ORDER_CANCELLED: 'sales.order.cancelled',

  // Pricing & Promotions
  PRICE_TABLE_UPDATED: 'sales.price-table.updated',
  CAMPAIGN_ACTIVATED: 'sales.campaign.activated',
} as const;

export type SalesEventType = (typeof SALES_EVENTS)[keyof typeof SALES_EVENTS];

// ─── Event Data Interfaces ───────────────────────────────────────────────────

export interface DealCreatedData {
  dealId: string;
  customerId: string;
  value: number;
}

export interface DealWonData {
  dealId: string;
  customerId: string;
  value: number;
}

export interface DealLostData {
  dealId: string;
  reason: string;
}

export interface ContactCreatedData {
  contactId: string;
  customerId: string;
  source: string;
}

export interface StageChangedData {
  dealId: string;
  fromStage: string;
  toStage: string;
}

export interface OrderConfirmedData {
  orderId: string;
  customerId: string;
  items: Array<{
    variantId: string;
    quantity: number;
    unitPrice: number;
  }>;
  total: number;
}

export interface OrderCancelledData {
  orderId: string;
  reason: string;
}

export interface PriceTableUpdatedData {
  tableId: string;
  changedVariants: Array<{
    variantId: string;
    oldPrice: number;
    newPrice: number;
  }>;
}

export interface CampaignActivatedData {
  campaignId: string;
  products: string[];
  channels: string[];
}
