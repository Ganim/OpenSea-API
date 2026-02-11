import type { FinanceAttachment } from '@/entities/finance/finance-attachment';

export interface FinanceAttachmentDTO {
  id: string;
  tenantId: string;
  entryId: string;
  type: string;
  fileName: string;
  fileKey: string;
  fileSize: number;
  mimeType: string;
  url?: string;
  uploadedBy?: string;
  createdAt: Date;
}

export function financeAttachmentToDTO(
  attachment: FinanceAttachment,
): FinanceAttachmentDTO {
  return {
    id: attachment.id.toString(),
    tenantId: attachment.tenantId.toString(),
    entryId: attachment.entryId.toString(),
    type: attachment.type,
    fileName: attachment.fileName,
    fileKey: attachment.fileKey,
    fileSize: attachment.fileSize,
    mimeType: attachment.mimeType,
    uploadedBy: attachment.uploadedBy,
    createdAt: attachment.createdAt,
  };
}
