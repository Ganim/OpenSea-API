import type { Proposal } from '@/entities/sales/proposal';

export interface ProposalItemDTO {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface ProposalAttachmentDTO {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  createdAt: Date;
}

export interface ProposalDTO {
  id: string;
  tenantId: string;
  customerId: string;
  title: string;
  description?: string;
  status: string;
  validUntil?: Date;
  terms?: string;
  totalValue: number;
  sentAt?: Date;
  createdBy: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
  items: ProposalItemDTO[];
  attachments: ProposalAttachmentDTO[];
}

export function proposalToDTO(proposal: Proposal): ProposalDTO {
  const dto: ProposalDTO = {
    id: proposal.id.toString(),
    tenantId: proposal.tenantId.toString(),
    customerId: proposal.customerId.toString(),
    title: proposal.title,
    status: proposal.status,
    totalValue: proposal.totalValue,
    createdBy: proposal.createdBy,
    isActive: proposal.isActive,
    createdAt: proposal.createdAt,
    items: proposal.items.map((proposalItem) => ({
      id: proposalItem.id.toString(),
      description: proposalItem.description,
      quantity: proposalItem.quantity,
      unitPrice: proposalItem.unitPrice,
      total: proposalItem.total,
    })),
    attachments: proposal.attachments.map((attachment) => ({
      id: attachment.id.toString(),
      fileName: attachment.fileName,
      fileUrl: attachment.fileUrl,
      fileSize: attachment.fileSize,
      createdAt: attachment.createdAt,
    })),
  };

  if (proposal.description) dto.description = proposal.description;
  if (proposal.validUntil) dto.validUntil = proposal.validUntil;
  if (proposal.terms) dto.terms = proposal.terms;
  if (proposal.sentAt) dto.sentAt = proposal.sentAt;
  if (proposal.updatedAt) dto.updatedAt = proposal.updatedAt;
  if (proposal.deletedAt) dto.deletedAt = proposal.deletedAt;

  return dto;
}
