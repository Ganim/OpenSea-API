import type { Item } from '@/entities/stock/item';

export interface ItemDTO {
  id: string;
  variantId: string;
  locationId: string;
  uniqueCode: string;
  initialQuantity: number;
  currentQuantity: number;
  status: string;
  entryDate: Date;
  attributes: Record<string, unknown>;
  batchNumber?: string;
  manufacturingDate?: Date;
  expiryDate?: Date;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export function itemToDTO(item: Item): ItemDTO {
  return {
    id: item.id.toString(),
    variantId: item.variantId.toString(),
    locationId: item.locationId.toString(),
    uniqueCode: item.uniqueCode,
    initialQuantity: item.initialQuantity,
    currentQuantity: item.currentQuantity,
    status: item.status.value,
    entryDate: item.entryDate,
    attributes: item.attributes,
    batchNumber: item.batchNumber,
    manufacturingDate: item.manufacturingDate,
    expiryDate: item.expiryDate,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    deletedAt: item.deletedAt,
  };
}
