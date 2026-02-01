import type { Prisma } from '@prisma/generated/client.js';
import type { ItemStatusValue } from '@/entities/stock/value-objects/item-status';
import { prisma } from '@/lib/prisma';
import { createProduct } from '@/utils/tests/factories/stock/create-product.e2e';
import { createVariant } from '@/utils/tests/factories/stock/create-variant.e2e';

interface CreateItemOptions {
  variantId?: string;
  uniqueCode?: string;
  status?: ItemStatusValue;
  initialQuantity?: number;
  binId?: string;
  attributes?: Record<string, unknown>;
  entryDate?: Date;
}

function generateTestBarcode(fullCode: string): string {
  return fullCode.replace(/[^A-Za-z0-9.-]/g, '');
}

function generateTestEAN13(fullCode: string): string {
  const hash = Math.abs(
    fullCode.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0),
  );
  const digits = String(hash).padStart(12, '0').slice(0, 12);
  return digits + '0';
}

function generateTestUPC(fullCode: string): string {
  const hash = Math.abs(
    fullCode.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0),
  );
  const digits = String(hash).padStart(11, '0').slice(0, 11);
  return digits + '0';
}

function generateTestSlug(base: string, suffix: string) {
  return (
    base
      .normalize('NFKD')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '')
      .replace(/_/g, '-')
      .replace(/--+/g, '-')
      .replace(/^-+|-+$/g, '') + `-${suffix}`
  );
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
  const { product } = await createProduct({
    name: `Product ${timestamp}`,
    templateId: template.id,
  });

  // Create variant
  const { variant } = await createVariant({
    productId: product.id,
    name: `Variant ${timestamp}`,
    sku: `VAR-${timestamp}`,
    price: 100,
  });

  // Create item
  const initialQuantity = options?.initialQuantity ?? 1;
  const variantId = options?.variantId ?? variant.id;
  const existingCount = await prisma.item.count({ where: { variantId } });
  const sequentialCode = existingCount + 1;
  const itemFullCode = `${variant.fullCode}-${String(sequentialCode).padStart(5, '0')}`;
  const uniqueCode = options?.uniqueCode ?? `ITEM-${timestamp}`;
  const slug = generateTestSlug(
    uniqueCode,
    `${variant.fullCode}-${sequentialCode}`,
  );
  const barcode = generateTestBarcode(itemFullCode);
  const eanCode = generateTestEAN13(itemFullCode);
  const upcCode = generateTestUPC(itemFullCode);

  const item = await prisma.item.create({
    data: {
      variantId,
      uniqueCode,
      slug,
      fullCode: itemFullCode,
      sequentialCode,
      status: options?.status ?? 'AVAILABLE',
      initialQuantity,
      currentQuantity: initialQuantity,
      entryDate: options?.entryDate ?? new Date(),
      attributes: (options?.attributes ?? {}) as Prisma.InputJsonValue,
      binId: options?.binId,
      barcode,
      eanCode,
      upcCode,
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
