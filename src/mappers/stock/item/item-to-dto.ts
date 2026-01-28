import type { Item } from '@/entities/stock/item';
import type { ItemRelatedData } from '@/repositories/stock/items-repository';

export interface ItemDTO {
  id: string;
  variantId: string;
  binId?: string;
  locationId?: string;
  resolvedAddress?: string;
  uniqueCode?: string;
  fullCode?: string;
  sequentialCode?: number;
  initialQuantity: number;
  currentQuantity: number;
  unitCost?: number;
  totalCost?: number;
  status: string;
  entryDate: Date;
  attributes: Record<string, unknown>;
  batchNumber?: string;
  manufacturingDate?: Date;
  expiryDate?: Date;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
  productCode: string;
  productName: string;
  variantSku: string;
  variantName: string;
  bin?: {
    id: string;
    address: string;
    zone: {
      id: string;
      warehouseId: string;
      code: string;
      name: string;
    };
  };
}

export function itemToDTO(item: Item, relatedData?: ItemRelatedData): ItemDTO {
  return {
    id: item.id.toString(),
    variantId: item.variantId.toString(),
    binId: item.binId?.toString() || relatedData?.binId,
    locationId: item.binId?.toString() || relatedData?.binId, // Alias para binId (compatibilidade)
    resolvedAddress: relatedData?.binAddress,
    uniqueCode: item.uniqueCode,
    fullCode: item.fullCode,
    sequentialCode: item.sequentialCode,
    initialQuantity: item.initialQuantity,
    currentQuantity: item.currentQuantity,
    unitCost: item.unitCost,
    totalCost: item.totalCost,
    status: item.status.value,
    entryDate: item.entryDate,
    attributes: item.attributes,
    batchNumber: item.batchNumber,
    manufacturingDate: item.manufacturingDate,
    expiryDate: item.expiryDate,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    deletedAt: item.deletedAt,
    productCode: relatedData?.productCode ?? '',
    productName: relatedData?.productName ?? '',
    variantSku: relatedData?.variantSku ?? '',
    variantName: relatedData?.variantName ?? '',
    bin:
      relatedData?.binId &&
      relatedData?.binAddress &&
      relatedData?.zoneId &&
      relatedData?.zoneWarehouseId
        ? {
            id: relatedData.binId,
            address: relatedData.binAddress,
            zone: {
              id: relatedData.zoneId,
              warehouseId: relatedData.zoneWarehouseId,
              code: relatedData.zoneCode ?? '',
              name: relatedData.zoneName ?? '',
            },
          }
        : undefined,
  };
}
