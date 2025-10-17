import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Variant } from '@/entities/stock/variant';
import { faker } from '@faker-js/faker';

interface MakeVariantProps {
  productId?: string;
  sku?: string;
  name?: string;
  price?: number;
  imageUrl?: string;
  attributes?: Record<string, unknown>;
  costPrice?: number;
  profitMargin?: number;
  barcode?: string;
  qrCode?: string;
  eanCode?: string;
  upcCode?: string;
  minStock?: number;
  maxStock?: number;
  reorderPoint?: number;
  reorderQuantity?: number;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export function makeVariant(override: MakeVariantProps = {}): Variant {
  const variant = Variant.create(
    {
      productId: override.productId
        ? new UniqueEntityID(override.productId)
        : new UniqueEntityID(),
      sku: override.sku ?? faker.string.alphanumeric(10).toUpperCase(),
      name: override.name ?? faker.commerce.productName(),
      price: override.price ?? Number(faker.commerce.price()),
      imageUrl: override.imageUrl,
      attributes: override.attributes ?? {},
      costPrice: override.costPrice,
      profitMargin: override.profitMargin,
      barcode: override.barcode,
      qrCode: override.qrCode,
      eanCode: override.eanCode,
      upcCode: override.upcCode,
      minStock: override.minStock,
      maxStock: override.maxStock,
      reorderPoint: override.reorderPoint,
      reorderQuantity: override.reorderQuantity,
      createdAt: override.createdAt ?? new Date(),
      updatedAt: override.updatedAt,
      deletedAt: override.deletedAt,
    },
    new UniqueEntityID(),
  );

  return variant;
}
