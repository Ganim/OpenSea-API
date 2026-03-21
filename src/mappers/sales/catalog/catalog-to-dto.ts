import type { Catalog } from '@/entities/sales/catalog';

export interface CatalogDTO {
  id: string;
  tenantId: string;
  name: string;
  slug: string | null;
  description: string | null;
  type: string;
  status: string;
  coverImageFileId: string | null;
  assignedToUserId: string | null;
  customerId: string | null;
  campaignId: string | null;
  rules: Record<string, unknown> | null;
  aiCurated: boolean;
  layout: string;
  showPrices: boolean;
  showStock: boolean;
  priceTableId: string | null;
  isPublic: boolean;
  publicUrl: string | null;
  qrCodeUrl: string | null;
  itemCount?: number;
  createdAt: Date;
  updatedAt: Date | null;
}

export function catalogToDTO(catalog: Catalog, itemCount?: number): CatalogDTO {
  return {
    id: catalog.id.toString(),
    tenantId: catalog.tenantId.toString(),
    name: catalog.name,
    slug: catalog.slug ?? null,
    description: catalog.description ?? null,
    type: catalog.type,
    status: catalog.status,
    coverImageFileId: catalog.coverImageFileId ?? null,
    assignedToUserId: catalog.assignedToUserId?.toString() ?? null,
    customerId: catalog.customerId?.toString() ?? null,
    campaignId: catalog.campaignId?.toString() ?? null,
    rules: catalog.rules ?? null,
    aiCurated: catalog.aiCurated,
    layout: catalog.layout,
    showPrices: catalog.showPrices,
    showStock: catalog.showStock,
    priceTableId: catalog.priceTableId?.toString() ?? null,
    isPublic: catalog.isPublic,
    publicUrl: catalog.publicUrl ?? null,
    qrCodeUrl: catalog.qrCodeUrl ?? null,
    itemCount,
    createdAt: catalog.createdAt,
    updatedAt: catalog.updatedAt ?? null,
  };
}
