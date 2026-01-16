import type { ItemStatusValue } from '@/entities/stock/value-objects/item-status';
import { prisma } from '@/lib/prisma';

interface CreateItemOptions {
  variantId?: string;
  uniqueCode?: string;
  status?: ItemStatusValue;
  initialQuantity?: number;
}

/**
 * Creates a complete item with template, product and variant for E2E tests
 */
export async function createItemE2E(options?: CreateItemOptions) {
  const timestamp = Date.now();

  // Create template
  const template = await prisma.template.create({
    data: {
      name: `Template ${timestamp}`,
      productAttributes: {},
      variantAttributes: {},
      itemAttributes: {},
    },
  });

  // Create product
  const product = await prisma.product.create({
    data: {
      name: `Product ${timestamp}`,
      status: 'ACTIVE',
      templateId: template.id,
    },
  });

  // Create variant
  const variant = await prisma.variant.create({
    data: {
      productId: product.id,
      name: `Variant ${timestamp}`,
      sku: `VAR-${timestamp}`,
      price: 100,
      costPrice: 50,
      isActive: true,
    },
  });

  // Create item
  const initialQuantity = options?.initialQuantity ?? 1;
  const item = await prisma.item.create({
    data: {
      variantId: options?.variantId ?? variant.id,
      uniqueCode: options?.uniqueCode ?? `ITEM-${timestamp}`,
      status: options?.status ?? 'AVAILABLE',
      initialQuantity,
      currentQuantity: initialQuantity,
    },
  });

  return {
    template,
    product,
    variant,
    item,
    itemId: item.id,
  };
}
