import { randomUUID } from 'node:crypto';
import type {
  CreateProductCareInstructionData,
  ProductCareInstructionRecord,
  ProductCareInstructionsRepository,
} from '../product-care-instructions-repository';

export class InMemoryProductCareInstructionsRepository
  implements ProductCareInstructionsRepository
{
  public items: ProductCareInstructionRecord[] = [];

  async create(
    data: CreateProductCareInstructionData,
  ): Promise<ProductCareInstructionRecord> {
    const record: ProductCareInstructionRecord = {
      id: randomUUID(),
      productId: data.productId,
      tenantId: data.tenantId,
      careInstructionId: data.careInstructionId,
      order: data.order ?? 0,
      createdAt: new Date(),
    };

    this.items.push(record);
    return record;
  }

  async findByProductId(
    productId: string,
  ): Promise<ProductCareInstructionRecord[]> {
    return this.items
      .filter((item) => item.productId === productId)
      .sort((a, b) => a.order - b.order);
  }

  async findById(id: string): Promise<ProductCareInstructionRecord | null> {
    return this.items.find((item) => item.id === id) ?? null;
  }

  async findByProductIdAndCareInstructionId(
    productId: string,
    careInstructionId: string,
  ): Promise<ProductCareInstructionRecord | null> {
    return (
      this.items.find(
        (item) =>
          item.productId === productId &&
          item.careInstructionId === careInstructionId,
      ) ?? null
    );
  }

  async delete(id: string): Promise<void> {
    const index = this.items.findIndex((item) => item.id === id);
    if (index !== -1) {
      this.items.splice(index, 1);
    }
  }
}
