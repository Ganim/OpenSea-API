import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryProposalsRepository } from '@/repositories/sales/in-memory/in-memory-proposals-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateProposalUseCase } from './create-proposal';
import { GetProposalByIdUseCase } from './get-proposal-by-id';

let proposalsRepository: InMemoryProposalsRepository;
let createProposalUseCase: CreateProposalUseCase;
let sut: GetProposalByIdUseCase;

describe('GetProposalByIdUseCase', () => {
  beforeEach(() => {
    proposalsRepository = new InMemoryProposalsRepository();
    createProposalUseCase = new CreateProposalUseCase(proposalsRepository);
    sut = new GetProposalByIdUseCase(proposalsRepository);
  });

  it('should return a proposal by id', async () => {
    const { proposal: createdProposal } = await createProposalUseCase.execute({
      tenantId: 'tenant-1',
      customerId: 'customer-1',
      title: 'Test Proposal',
      createdBy: 'user-1',
      items: [{ description: 'Item A', quantity: 1, unitPrice: 100 }],
    });

    const { proposal } = await sut.execute({
      tenantId: 'tenant-1',
      id: createdProposal.id,
    });

    expect(proposal.title).toBe('Test Proposal');
    expect(proposal.items).toHaveLength(1);
  });

  it('should throw ResourceNotFoundError for non-existent proposal', async () => {
    await expect(() =>
      sut.execute({ tenantId: 'tenant-1', id: 'non-existent' }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
