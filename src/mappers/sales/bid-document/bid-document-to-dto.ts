import type { BidDocument } from '@/entities/sales/bid-document';

export interface BidDocumentDTO {
  id: string;
  tenantId: string;
  bidId: string | null;
  type: string;
  name: string;
  description: string | null;
  fileId: string;
  issueDate: Date | null;
  expirationDate: Date | null;
  isValid: boolean;
  autoRenewable: boolean;
  lastRenewAttempt: Date | null;
  renewStatus: string | null;
  portalUploaded: boolean;
  portalUploadedAt: Date | null;
  createdAt: Date;
  updatedAt: Date | null;
}

export function bidDocumentToDTO(doc: BidDocument): BidDocumentDTO {
  return {
    id: doc.id.toString(),
    tenantId: doc.tenantId.toString(),
    bidId: doc.bidId?.toString() ?? null,
    type: doc.type,
    name: doc.name,
    description: doc.description ?? null,
    fileId: doc.fileId.toString(),
    issueDate: doc.issueDate ?? null,
    expirationDate: doc.expirationDate ?? null,
    isValid: doc.isValid,
    autoRenewable: doc.autoRenewable,
    lastRenewAttempt: doc.lastRenewAttempt ?? null,
    renewStatus: doc.renewStatus ?? null,
    portalUploaded: doc.portalUploaded,
    portalUploadedAt: doc.portalUploadedAt ?? null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt ?? null,
  };
}
