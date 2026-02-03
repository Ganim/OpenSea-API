import type { Prisma } from '@prisma/generated/client.js';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'node:crypto';

interface CreateProductProps {
  tenantId: string;
  name?: string;
  templateId?: string;
  outOfLine?: boolean;
  status?: 'ACTIVE' | 'INACTIVE';
  attributes?: Record<string, unknown>;
  description?: string;
  organizationId?: string;
  manufacturerId?: string;
  supplierId?: string;
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
  return digits + '0'; // Simplified check digit
}

function generateTestUPC(fullCode: string): string {
  const hash = Math.abs(
    fullCode.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0),
  );
  const digits = String(hash).padStart(11, '0').slice(0, 11);
  return digits + '0'; // Simplified check digit
}

function generateTestSlug(name: string, seq: number): string {
  return (
    name
      .normalize('NFKD')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '')
      .replace(/_/g, '-')
      .replace(/--+/g, '-')
      .replace(/^-+|-+$/g, '') + `-${seq}`
  );
}

export async function createProduct(override: CreateProductProps) {
  const productId = randomUUID();
  const timestamp = Date.now();
  const seq = Math.floor(Math.random() * 10000) + 1;

  // Se não foi fornecido um templateId, criar um template temporário
  let templateId = override.templateId;
  const templateCode = String(timestamp).slice(-3).padStart(3, '0');
  if (!templateId) {
    const template = await prisma.template.create({
      data: {
        id: randomUUID(),
        tenantId: override.tenantId,
        name: `Test Template ${timestamp}`,
        code: templateCode,
        productAttributes: {},
        variantAttributes: {},
        itemAttributes: {},
      },
    });
    templateId = template.id;
  }

  const fullCode = `${templateCode}.000.${String(seq).padStart(4, '0')}`;
  const name = override.name ?? `Test Product ${timestamp}`;
  const slug = generateTestSlug(name, seq);
  const barcode = generateTestBarcode(fullCode);
  const eanCode = generateTestEAN13(fullCode);
  const upcCode = generateTestUPC(fullCode);

  const product = await prisma.product.create({
    data: {
      id: productId,
      tenantId: override.tenantId,
      name,
      slug,
      fullCode,
      barcode,
      eanCode,
      upcCode,
      status: override.status ?? 'ACTIVE',
      outOfLine: override.outOfLine ?? false,
      attributes: (override.attributes ?? {}) as Prisma.InputJsonValue,
      description: override.description,
      templateId,
      organizationId: override.organizationId,
      manufacturerId: override.manufacturerId,
      supplierId: override.supplierId,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  return {
    product,
    productId: product.id,
  };
}
