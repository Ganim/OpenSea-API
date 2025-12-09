import { prisma } from '@/lib/prisma';
import { randomUUID } from 'node:crypto';

interface CreateProductProps {
  name?: string;
  code?: string;
  templateId?: string;
}

export async function createProduct(override: CreateProductProps = {}) {
  const productId = randomUUID();
  const timestamp = Date.now();

  // Se não foi fornecido um templateId, criar um template temporário
  let templateId = override.templateId;
  if (!templateId) {
    const template = await prisma.template.create({
      data: {
        id: randomUUID(),
        name: `Test Template ${timestamp}`,
        productAttributes: {},
        variantAttributes: {},
        itemAttributes: {},
      },
    });
    templateId = template.id;
  }

  const product = await prisma.product.create({
    data: {
      id: productId,
      name: override.name ?? `Test Product ${timestamp}`,
      code: override.code ?? `PROD-${timestamp}`,
      status: 'ACTIVE',
      templateId,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  return {
    product,
    productId: product.id,
  };
}
