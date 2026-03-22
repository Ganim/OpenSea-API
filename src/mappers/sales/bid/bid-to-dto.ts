import type { Bid } from '@/entities/sales/bid';

export interface BidDTO {
  id: string;
  tenantId: string;
  portalName: string;
  portalEditalId: string | null;
  editalNumber: string;
  modality: string;
  criterionType: string;
  legalFramework: string;
  executionRegime: string | null;
  object: string;
  objectSummary: string | null;
  organName: string;
  organCnpj: string | null;
  organState: string | null;
  organCity: string | null;
  estimatedValue: number | null;
  ourProposalValue: number | null;
  finalValue: number | null;
  margin: number | null;
  publicationDate: Date | null;
  openingDate: Date;
  closingDate: Date | null;
  disputeDate: Date | null;
  status: string;
  viabilityScore: number | null;
  viabilityReason: string | null;
  customerId: string | null;
  assignedToUserId: string | null;
  exclusiveMeEpp: boolean;
  deliveryStates: string[];
  tags: string[];
  notes: string | null;
  editalUrl: string | null;
  editalFileId: string | null;
  etpFileId: string | null;
  trFileId: string | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date | null;
}

export function bidToDTO(bid: Bid): BidDTO {
  return {
    id: bid.id.toString(),
    tenantId: bid.tenantId.toString(),
    portalName: bid.portalName,
    portalEditalId: bid.portalEditalId ?? null,
    editalNumber: bid.editalNumber,
    modality: bid.modality,
    criterionType: bid.criterionType,
    legalFramework: bid.legalFramework,
    executionRegime: bid.executionRegime ?? null,
    object: bid.object,
    objectSummary: bid.objectSummary ?? null,
    organName: bid.organName,
    organCnpj: bid.organCnpj ?? null,
    organState: bid.organState ?? null,
    organCity: bid.organCity ?? null,
    estimatedValue: bid.estimatedValue ?? null,
    ourProposalValue: bid.ourProposalValue ?? null,
    finalValue: bid.finalValue ?? null,
    margin: bid.margin ?? null,
    publicationDate: bid.publicationDate ?? null,
    openingDate: bid.openingDate,
    closingDate: bid.closingDate ?? null,
    disputeDate: bid.disputeDate ?? null,
    status: bid.status,
    viabilityScore: bid.viabilityScore ?? null,
    viabilityReason: bid.viabilityReason ?? null,
    customerId: bid.customerId?.toString() ?? null,
    assignedToUserId: bid.assignedToUserId?.toString() ?? null,
    exclusiveMeEpp: bid.exclusiveMeEpp,
    deliveryStates: bid.deliveryStates,
    tags: bid.tags,
    notes: bid.notes ?? null,
    editalUrl: bid.editalUrl ?? null,
    editalFileId: bid.editalFileId?.toString() ?? null,
    etpFileId: bid.etpFileId?.toString() ?? null,
    trFileId: bid.trFileId?.toString() ?? null,
    deletedAt: bid.deletedAt ?? null,
    createdAt: bid.createdAt,
    updatedAt: bid.updatedAt ?? null,
  };
}
