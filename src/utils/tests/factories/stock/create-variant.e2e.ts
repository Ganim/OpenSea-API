import { prisma } from '@/lib/prisma';
import { randomUUID } from 'node:crypto';

interface CreateVariantProps {
  productId: string;
  sku?: string;
  name?: string;
  price?: number;
}

// Funções auxiliares para gerar códigos de barras (simplificadas para testes)
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

function generateTestSlug(name: string, suffix: string): string {
  return (
    name
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

export async function createVariant(props: CreateVariantProps) {
  const variantId = randomUUID();
  const timestamp = Date.now();

  // Get product fullCode for variant fullCode generation
  const product = await prisma.product.findUnique({
    where: { id: props.productId },
    select: { fullCode: true },
  });

  // Count existing variants to determine sequential code
  const variantCount = await prisma.variant.count({
    where: { productId: props.productId },
  });
  const sequentialCode = variantCount + 1;
  const productFullCode = product?.fullCode ?? '000.000.0000';
  const fullCode = `${productFullCode}.${String(sequentialCode).padStart(3, '0')}`;

  const name = props.name ?? `Test Variant ${timestamp}`;
  const slug = generateTestSlug(name, `${productFullCode}-${sequentialCode}`);
  const barcode = generateTestBarcode(fullCode);
  const eanCode = generateTestEAN13(fullCode);
  const upcCode = generateTestUPC(fullCode);

  const variant = await prisma.variant.create({
    data: {
      id: variantId,
      productId: props.productId,
      sku: props.sku ?? `SKU-${timestamp}`,
      name,
      slug,
      fullCode,
      sequentialCode,
      barcode,
      eanCode,
      upcCode,
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
