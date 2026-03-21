import type { CustomerPrice } from '@/entities/sales/customer-price';

export interface CustomerPriceDTO {
  id: string;
  tenantId: string;
  customerId: string;
  variantId: string;
  price: number;
  validFrom: Date | null;
  validUntil: Date | null;
  notes: string | null;
  createdByUserId: string;
  createdAt: Date;
  updatedAt: Date | null;
}

export function customerPriceToDTO(customerPrice: CustomerPrice): CustomerPriceDTO {
  return {
    id: customerPrice.id.toString(),
    tenantId: customerPrice.tenantId.toString(),
    customerId: customerPrice.customerId.toString(),
    variantId: customerPrice.variantId.toString(),
    price: customerPrice.price,
    validFrom: customerPrice.validFrom ?? null,
    validUntil: customerPrice.validUntil ?? null,
    notes: customerPrice.notes ?? null,
    createdByUserId: customerPrice.createdByUserId.toString(),
    createdAt: customerPrice.createdAt,
    updatedAt: customerPrice.updatedAt ?? null,
  };
}
