import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryProposalsRepository } from '@/repositories/sales/in-memory/in-memory-proposals-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateProposalUseCase } from './create-proposal';
import { RejectProposalUseCase } from './reject-proposal';

let proposalsRepository: InMemoryProposalsRepository;
let createProposalUseCase: CreateProposalUseCase;
let sut: RejectProposalUseCase;

describe('RejectProposalUseCase', () => {
  beforeEach(() => {
    proposalsRepository = new InMemoryProposalsRepository();
    createProposalUseCase = new CreateProposalUseCase(proposalsRepository);
    sut = new RejectProposalUseCase(proposalsRepository);
  });

  it('should reject a SENT proposal', async () => {
    const { proposal: createdProposal } = await createProposalUseCase.execute({
      tenantId: 'tenant-1',
      customerId: 'customer-1',
      title: 'Proposal to Reject',
      createdBy: 'user-1',
      items: [{ description: 'Item A', quantity: 1, unitPrice: 5000 }],
    });

    proposalsRepository.proposals[0].status = 'SENT';

    const { proposal } = await sut.execute({
      tenantId: 'tenant-1',
      id: createdProposal.id,
    });

    expect(proposal.status).toBe('REJECTED');
  });

  it('should reject an UNDER_REVIEW proposal', async () => {
    const { proposal: createdProposal } = await createProposalUseCase.execute({
      tenantId: 'tenant-1',
      customerId: 'customer-1',
      title: 'Under Review Proposal',
      createdBy: 'user-1',
      items: [{ description: 'Item A', quantity: 1, unitPrice: 3000 }],
    });

    proposalsRepository.proposals[0].status = 'UNDER_REVIEW';

    const { proposal } = await sut.execute({
      tenantId: 'tenant-1',
      id: createdProposal.id,
    });

    expect(proposal.status).toBe('REJECTED');
  });

  it('should throw if proposal is in DRAFT status', async () => {
    const { proposal: createdProposal } = await createProposalUseCase.execute({
      tenantId: 'tenant-1',
      customerId: 'customer-1',
      title: 'Draft Proposal',
      createdBy: 'user-1',
      items: [{ description: 'Item A', quantity: 1, unitPrice: 100 }],
    });

    await expect(() =>
      sut.execute({ tenantId: 'tenant-1', id: createdProposal.id }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should throw ResourceNotFoundError for non-existent proposal', async () => {
    await expect(() =>
      sut.execute({ tenantId: 'tenant-1', id: 'non-existent' }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
