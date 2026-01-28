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
  const templateCode = String(timestamp).slice(-3).padStart(3, '0');
  const template = await prisma.template.create({
    data: {
      name: `Template ${timestamp}`,
      code: templateCode,
      productAttributes: {},
      variantAttributes: {},
      itemAttributes: {},
    },
  });

  // Create product
  const productFullCode = `${templateCode}.000.0001`;
  const product = await prisma.product.create({
    data: {
      name: `Product ${timestamp}`,
      fullCode: productFullCode,
      status: 'ACTIVE',
      templateId: template.id,
    },
  });

  // Create variant
  const variantFullCode = `${productFullCode}.001`;
  const variant = await prisma.variant.create({
    data: {
      productId: product.id,
      name: `Variant ${timestamp}`,
      sku: `VAR-${timestamp}`,
      fullCode: variantFullCode,
      sequentialCode: 1,
      price: 100,
      costPrice: 50,
      isActive: true,
    },
  });

  // Create item
  const initialQuantity = options?.initialQuantity ?? 1;
  const itemFullCode = `${variantFullCode}-00001`;
  const item = await prisma.item.create({
    data: {
      variantId: options?.variantId ?? variant.id,
      uniqueCode: options?.uniqueCode ?? `ITEM-${timestamp}`,
      fullCode: itemFullCode,
      sequentialCode: 1,
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
