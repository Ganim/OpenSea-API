import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
  MarketplaceOrder,
  MarketplaceOrderStatusType,
} from '@/entities/sales/marketplace-order';

export interface CreateMarketplaceOrderSchema {
  tenantId: string;
  connectionId: string;
  externalOrderId: string;
  externalOrderUrl?: string;
  status?: MarketplaceOrderStatusType;
  buyerName: string;
  buyerDocument?: string;
  buyerEmail?: string;
  buyerPhone?: string;
  customerId?: string;
  subtotal: number;
  shippingCost?: number;
  marketplaceFee?: number;
  netAmount: number;
  currency?: string;
  shippingMethod?: string;
  deliveryAddress: Record<string, unknown>;
  receivedAt: Date;
  notes?: string;
}

export interface MarketplaceOrdersRepository {
  create(data: CreateMarketplaceOrderSchema): Promise<MarketplaceOrder>;
  findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<MarketplaceOrder | null>;
  findByExternalId(
    connectionId: string,
    externalOrderId: string,
  ): Promise<MarketplaceOrder | null>;
  findManyByConnection(
    connectionId: string,
    page: number,
    perPage: number,
    tenantId: string,
  ): Promise<MarketplaceOrder[]>;
  findManyByTenant(
    page: number,
    perPage: number,
    tenantId: string,
    status?: MarketplaceOrderStatusType,
  ): Promise<MarketplaceOrder[]>;
  countByConnection(connectionId: string, tenantId: string): Promise<number>;
  countByTenant(
    tenantId: string,
    status?: MarketplaceOrderStatusType,
  ): Promise<number>;
  save(order: MarketplaceOrder): Promise<void>;
}
