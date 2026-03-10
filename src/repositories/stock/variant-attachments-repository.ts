export interface CreateVariantAttachmentData {
  variantId: string;
  tenantId: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  label?: string;
  order?: number;
}

export interface VariantAttachmentRecord {
  id: string;
  variantId: string;
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

export interface VariantAttachmentsRepository {
  create(data: CreateVariantAttachmentData): Promise<VariantAttachmentRecord>;
  findByVariantId(variantId: string): Promise<VariantAttachmentRecord[]>;
  findById(id: string): Promise<VariantAttachmentRecord | null>;
  delete(id: string): Promise<void>;
}
