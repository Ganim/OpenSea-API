import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { FinanceAttachment } from '@/entities/finance/finance-attachment';

export interface CreateFinanceAttachmentSchema {
  tenantId: string;
  entryId: string;
  type?: string;
  fileName: string;
  fileKey: string;
  fileSize: number;
  mimeType: string;
  uploadedBy?: string;
}

export interface FinanceAttachmentsRepository {
  create(data: CreateFinanceAttachmentSchema): Promise<FinanceAttachment>;
  findById(id: UniqueEntityID, tenantId: string): Promise<FinanceAttachment | null>;
  findManyByEntryId(entryId: string, tenantId: string): Promise<FinanceAttachment[]>;
  delete(id: UniqueEntityID): Promise<void>;
}
