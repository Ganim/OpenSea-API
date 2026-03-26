import { InMemoryProposalsRepository } from '@/repositories/sales/in-memory/in-memory-proposals-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateProposalUseCase } from './create-proposal';
import { ListProposalsUseCase } from './list-proposals';

let proposalsRepository: InMemoryProposalsRepository;
let createProposalUseCase: CreateProposalUseCase;
let sut: ListProposalsUseCase;

describe('ListProposalsUseCase', () => {
  beforeEach(() => {
    proposalsRepository = new InMemoryProposalsRepository();
    createProposalUseCase = new CreateProposalUseCase(proposalsRepository);
    sut = new ListProposalsUseCase(proposalsRepository);
  });

  it('should list proposals with pagination', async () => {
    for (let i = 0; i < 5; i++) {
      await createProposalUseCase.execute({
        tenantId: 'tenant-1',
        customerId: 'customer-1',
        title: `Proposal ${i + 1}`,
        createdBy: 'user-1',
        items: [{ description: 'Item', quantity: 1, unitPrice: 100 }],
      });
    }

    const result = await sut.execute({
      tenantId: 'tenant-1',
      page: 1,
      perPage: 3,
    });

    expect(result.proposals).toHaveLength(3);
    expect(result.total).toBe(5);
    expect(result.totalPages).toBe(2);
  });

  it('should filter by status', async () => {
    await createProposalUseCase.execute({
      tenantId: 'tenant-1',
      customerId: 'customer-1',
      title: 'Draft Proposal',
      createdBy: 'user-1',
      items: [{ description: 'Item', quantity: 1, unitPrice: 100 }],
    });

    const sentProposal = await createProposalUseCase.execute({
      tenantId: 'tenant-1',
      customerId: 'customer-1',
      title: 'Sent Proposal',
      createdBy: 'user-1',
      items: [{ description: 'Item', quantity: 1, unitPrice: 200 }],
    });

    proposalsRepository.proposals.find(
      (proposalRecord) =>
        proposalRecord.id.toString() === sentProposal.proposal.id,
    )!.status = 'SENT';

    const result = await sut.execute({
      tenantId: 'tenant-1',
      status: 'DRAFT',
    });

    expect(result.proposals).toHaveLength(1);
    expect(result.proposals[0].title).toBe('Draft Proposal');
  });

  it('should return empty list for different tenant', async () => {
    await createProposalUseCase.execute({
      tenantId: 'tenant-1',
      customerId: 'customer-1',
      title: 'Proposal',
      createdBy: 'user-1',
      items: [{ description: 'Item', quantity: 1, unitPrice: 100 }],
    });

    const result = await sut.execute({ tenantId: 'tenant-2' });
    expect(result.proposals).toHaveLength(0);
  });
});
