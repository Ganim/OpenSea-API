import { prisma } from '@/lib/prisma';
import type {
  CreateProductCareInstructionData,
  ProductCareInstructionRecord,
  ProductCareInstructionsRepository,
} from '../product-care-instructions-repository';

export class PrismaProductCareInstructionsRepository
  implements ProductCareInstructionsRepository
{
  async create(
    data: CreateProductCareInstructionData,
  ): Promise<ProductCareInstructionRecord> {
    const record = await prisma.productCareInstruction.create({
      data: {
        productId: data.productId,
        tenantId: data.tenantId,
        careInstructionId: data.careInstructionId,
        order: data.order ?? 0,
      },
    });

    return {
      id: record.id,
      productId: record.productId,
      tenantId: record.tenantId,
      careInstructionId: record.careInstructionId,
      order: record.order,
      createdAt: record.createdAt,
    };
  }

  async findByProductId(
    productId: string,
  ): Promise<ProductCareInstructionRecord[]> {
    const records = await prisma.productCareInstruction.findMany({
      where: { productId },
      orderBy: { order: 'asc' },
    });

    return records.map((record) => ({
      id: record.id,
      productId: record.productId,
      tenantId: record.tenantId,
      careInstructionId: record.careInstructionId,
      order: record.order,
      createdAt: record.createdAt,
    }));
  }

  async findById(id: string): Promise<ProductCareInstructionRecord | null> {
    const record = await prisma.productCareInstruction.findUnique({
      where: { id },
    });

    if (!record) {
      return null;
    }

    return {
      id: record.id,
      productId: record.productId,
      tenantId: record.tenantId,
      careInstructionId: record.careInstructionId,
      order: record.order,
      createdAt: record.createdAt,
    };
  }

  async findByProductIdAndCareInstructionId(
    productId: string,
    careInstructionId: string,
  ): Promise<ProductCareInstructionRecord | null> {
    const record = await prisma.productCareInstruction.findUnique({
      where: {
        productId_careInstructionId: {
          productId,
          careInstructionId,
        },
      },
    });

    if (!record) {
      return null;
    }

    return {
      id: record.id,
      productId: record.productId,
      tenantId: record.tenantId,
      careInstructionId: record.careInstructionId,
      order: record.order,
      createdAt: record.createdAt,
    };
  }

  async delete(id: string): Promise<void> {
    await prisma.productCareInstruction.delete({
      where: { id },
    });
  }
}
