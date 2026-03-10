export interface CreateProductCareInstructionData {
  productId: string;
  tenantId: string;
  careInstructionId: string;
  order?: number;
}

export interface ProductCareInstructionRecord {
  id: string;
  productId: string;
  tenantId: string;
  careInstructionId: string;
  order: number;
  createdAt: Date;
}

export interface ProductCareInstructionsRepository {
  create(
    data: CreateProductCareInstructionData,
  ): Promise<ProductCareInstructionRecord>;
  findByProductId(productId: string): Promise<ProductCareInstructionRecord[]>;
  findById(id: string): Promise<ProductCareInstructionRecord | null>;
  findByProductIdAndCareInstructionId(
    productId: string,
    careInstructionId: string,
  ): Promise<ProductCareInstructionRecord | null>;
  delete(id: string): Promise<void>;
}
