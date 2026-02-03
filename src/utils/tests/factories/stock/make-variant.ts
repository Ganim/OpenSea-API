import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Slug } from '@/entities/stock/value-objects/slug';
import { Variant } from '@/entities/stock/variant';
import { faker } from '@faker-js/faker';

interface MakeVariantProps {
  tenantId?: UniqueEntityID;
  productId?: string;
  sku?: string;
  slug?: Slug;
  fullCode?: string;
  sequentialCode?: number;
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
  const variantName = override.name ?? faker.commerce.productName();
  const uniqueSuffix = faker.string.alphanumeric(6);

  const variant = Variant.create(
    {
      tenantId: override.tenantId ?? new UniqueEntityID('tenant-1'),
      productId: override.productId
        ? new UniqueEntityID(override.productId)
        : new UniqueEntityID(),
      slug:
        override.slug ?? Slug.createFromText(`${variantName}-${uniqueSuffix}`),
      fullCode: override.fullCode ?? `001.000.0001.${faker.string.numeric(3)}`,
      sequentialCode: override.sequentialCode ?? 1,
      sku: override.sku ?? faker.string.alphanumeric(10).toUpperCase(),
      name: variantName,
      price: override.price ?? Number(faker.commerce.price()),
      imageUrl: override.imageUrl,
      attributes: override.attributes ?? {},
      costPrice: override.costPrice,
      profitMargin: override.profitMargin,
      barcode:
        override.barcode ?? `BC${faker.string.alphanumeric(8).toUpperCase()}`,
      qrCode: override.qrCode,
      eanCode: override.eanCode ?? `EAN${faker.string.numeric(10)}`,
      upcCode: override.upcCode ?? `UPC${faker.string.numeric(9)}`,
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
