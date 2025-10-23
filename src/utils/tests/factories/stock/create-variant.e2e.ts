import { prisma } from '@/lib/prisma';
import { randomUUID } from 'node:crypto';

interface CreateVariantProps {
  productId: string;
  sku?: string;
  name?: string;
  price?: number;
}

export async function createVariant(props: CreateVariantProps) {
  const variantId = randomUUID();
  const timestamp = Date.now();

  const variant = await prisma.variant.create({
    data: {
      id: variantId,
      productId: props.productId,
      sku: props.sku ?? `SKU-${timestamp}`,
      name: props.name ?? `Test Variant ${timestamp}`,
      price: props.price ?? 100,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  return {
    variant,
    variantId: variant.id,
  };
}
