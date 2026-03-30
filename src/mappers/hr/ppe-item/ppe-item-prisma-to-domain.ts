import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PPECategory } from '@/entities/hr/ppe-item';
import type { PPEItem as PrismaPPEItem } from '@prisma/generated/client.js';

export function mapPPEItemPrismaToDomain(record: PrismaPPEItem) {
  return {
    tenantId: new UniqueEntityID(record.tenantId),
    name: record.name,
    category: record.category as PPECategory,
    caNumber: record.caNumber ?? undefined,
    manufacturer: record.manufacturer ?? undefined,
    model: record.model ?? undefined,
    expirationMonths: record.expirationMonths ?? undefined,
    minStock: record.minStock,
    currentStock: record.currentStock,
    isActive: record.isActive,
    notes: record.notes ?? undefined,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    deletedAt: record.deletedAt ?? undefined,
  };
}
