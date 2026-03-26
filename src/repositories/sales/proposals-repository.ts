import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Proposal, ProposalStatus } from '@/entities/sales/proposal';

export interface CreateProposalItemSchema {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface CreateProposalSchema {
  tenantId: string;
  customerId: string;
  title: string;
  description?: string;
  validUntil?: Date;
  terms?: string;
  totalValue: number;
  createdBy: string;
  items: CreateProposalItemSchema[];
}

export interface UpdateProposalSchema {
  id: UniqueEntityID;
  tenantId: string;
  customerId?: string;
  title?: string;
  description?: string | null;
  validUntil?: Date | null;
  terms?: string | null;
  items?: CreateProposalItemSchema[];
}

export interface ProposalsRepository {
  create(data: CreateProposalSchema): Promise<Proposal>;
  findById(id: UniqueEntityID, tenantId: string): Promise<Proposal | null>;
  findMany(
    page: number,
    perPage: number,
    tenantId: string,
    filters?: { status?: ProposalStatus; customerId?: string },
  ): Promise<Proposal[]>;
  countMany(
    tenantId: string,
    filters?: { status?: ProposalStatus; customerId?: string },
  ): Promise<number>;
  save(proposal: Proposal): Promise<void>;
  delete(id: UniqueEntityID, tenantId: string): Promise<void>;
}
