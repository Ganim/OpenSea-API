import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Proposal } from '@/entities/sales/proposal';
import type { ProposalStatus } from '@/entities/sales/proposal';
import type {
  CreateProposalSchema,
  ProposalsRepository,
} from '../proposals-repository';

export class InMemoryProposalsRepository implements ProposalsRepository {
  public proposals: Proposal[] = [];

  async create(data: CreateProposalSchema): Promise<Proposal> {
    const proposalId = new UniqueEntityID();

    const proposalItems = data.items.map((proposalItem) => ({
      id: new UniqueEntityID(),
      proposalId,
      description: proposalItem.description,
      quantity: proposalItem.quantity,
      unitPrice: proposalItem.unitPrice,
      total: proposalItem.total,
      createdAt: new Date(),
    }));

    const proposal = Proposal.create(
      {
        tenantId: new UniqueEntityID(data.tenantId),
        customerId: new UniqueEntityID(data.customerId),
        title: data.title,
        description: data.description,
        validUntil: data.validUntil,
        terms: data.terms,
        totalValue: data.totalValue,
        createdBy: data.createdBy,
        items: proposalItems,
      },
      proposalId,
    );

    this.proposals.push(proposal);
    return proposal;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<Proposal | null> {
    const proposal = this.proposals.find(
      (proposalRecord) =>
        proposalRecord.id.toString() === id.toString() &&
        proposalRecord.tenantId.toString() === tenantId &&
        !proposalRecord.deletedAt,
    );

    return proposal ?? null;
  }

  async findMany(
    page: number,
    perPage: number,
    tenantId: string,
    filters?: { status?: ProposalStatus; customerId?: string },
  ): Promise<Proposal[]> {
    let filteredProposals = this.proposals.filter(
      (proposalRecord) =>
        proposalRecord.tenantId.toString() === tenantId &&
        !proposalRecord.deletedAt,
    );

    if (filters?.status) {
      filteredProposals = filteredProposals.filter(
        (proposalRecord) => proposalRecord.status === filters.status,
      );
    }

    if (filters?.customerId) {
      filteredProposals = filteredProposals.filter(
        (proposalRecord) =>
          proposalRecord.customerId.toString() === filters.customerId,
      );
    }

    const start = (page - 1) * perPage;
    return filteredProposals
      .sort(
        (proposalA, proposalB) =>
          proposalB.createdAt.getTime() - proposalA.createdAt.getTime(),
      )
      .slice(start, start + perPage);
  }

  async countMany(
    tenantId: string,
    filters?: { status?: ProposalStatus; customerId?: string },
  ): Promise<number> {
    let filteredProposals = this.proposals.filter(
      (proposalRecord) =>
        proposalRecord.tenantId.toString() === tenantId &&
        !proposalRecord.deletedAt,
    );

    if (filters?.status) {
      filteredProposals = filteredProposals.filter(
        (proposalRecord) => proposalRecord.status === filters.status,
      );
    }

    if (filters?.customerId) {
      filteredProposals = filteredProposals.filter(
        (proposalRecord) =>
          proposalRecord.customerId.toString() === filters.customerId,
      );
    }

    return filteredProposals.length;
  }

  async save(proposal: Proposal): Promise<void> {
    const proposalIndex = this.proposals.findIndex(
      (proposalRecord) =>
        proposalRecord.id.toString() === proposal.id.toString(),
    );

    if (proposalIndex >= 0) {
      this.proposals[proposalIndex] = proposal;
    }
  }

  async updateViewTracking(id: string): Promise<boolean> {
    const proposal = this.proposals.find(
      (proposalRecord) =>
        proposalRecord.id.toString() === id && !proposalRecord.deletedAt,
    );

    if (!proposal) return false;

    const now = new Date();

    if (!proposal.viewedAt) {
      proposal.viewedAt = now;
    }

    proposal.viewCount = proposal.viewCount + 1;
    proposal.lastViewedAt = now;

    return true;
  }

  async delete(id: UniqueEntityID, tenantId: string): Promise<void> {
    const proposal = this.proposals.find(
      (proposalRecord) =>
        proposalRecord.id.toString() === id.toString() &&
        proposalRecord.tenantId.toString() === tenantId,
    );

    if (proposal) {
      proposal.delete();
    }
  }
}
