import type { ProductionBom } from '@/entities/production/bill-of-materials';

export interface BomDTO {
  id: string;
  productId: string;
  version: number;
  name: string;
  description: string | null;
  isDefault: boolean;
  validFrom: Date;
  validUntil: Date | null;
  status: string;
  baseQuantity: number;
  createdById: string;
  approvedById: string | null;
  approvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export function bomToDTO(entity: ProductionBom): BomDTO {
  return {
    id: entity.bomId.toString(),
    productId: entity.productId.toString(),
    version: entity.version,
    name: entity.name,
    description: entity.description,
    isDefault: entity.isDefault,
    validFrom: entity.validFrom,
    validUntil: entity.validUntil,
    status: entity.status,
    baseQuantity: entity.baseQuantity,
    createdById: entity.createdById.toString(),
    approvedById: entity.approvedById?.toString() ?? null,
    approvedAt: entity.approvedAt,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
}
