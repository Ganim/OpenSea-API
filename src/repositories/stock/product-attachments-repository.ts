export interface CreateProductAttachmentData {
  productId: string;
  tenantId: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  label?: string;
  order?: number;
}

export interface ProductAttachmentRecord {
  id: string;
  productId: string;
  tenantId: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  label: string | null;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductAttachmentsRepository {
  create(data: CreateProductAttachmentData): Promise<ProductAttachmentRecord>;
  findByProductId(productId: string): Promise<ProductAttachmentRecord[]>;
  findById(id: string): Promise<ProductAttachmentRecord | null>;
  delete(id: string): Promise<void>;
}
