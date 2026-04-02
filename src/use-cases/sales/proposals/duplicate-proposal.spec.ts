import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryProposalsRepository } from '@/repositories/sales/in-memory/in-memory-proposals-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateProposalUseCase } from './create-proposal';
import { DuplicateProposalUseCase } from './duplicate-proposal';

let proposalsRepository: InMemoryProposalsRepository;
let createProposalUseCase: CreateProposalUseCase;
let sut: DuplicateProposalUseCase;

describe('DuplicateProposalUseCase', () => {
  beforeEach(() => {
    proposalsRepository = new InMemoryProposalsRepository();
    createProposalUseCase = new CreateProposalUseCase(proposalsRepository);
    sut = new DuplicateProposalUseCase(proposalsRepository);
  });

  it('should duplicate a proposal as a new DRAFT', async () => {
    const { proposal: originalProposal } = await createProposalUseCase.execute({
      tenantId: 'tenant-1',
      customerId: 'customer-1',
      title: 'Original Proposal',
      description: 'Original description',
      createdBy: 'user-1',
      items: [
        { description: 'Item A', quantity: 2, unitPrice: 100 },
        { description: 'Item B', quantity: 1, unitPrice: 200 },
      ],
    });

    const { proposal: duplicatedProposal } = await sut.execute({
      tenantId: 'tenant-1',
      id: originalProposal.id,
      createdBy: 'user-2',
    });

    expect(duplicatedProposal.id).not.toBe(originalProposal.id);
    expect(duplicatedProposal.title).toBe('Original Proposal (copy)');
    expect(duplicatedProposal.status).toBe('DRAFT');
    expect(duplicatedProposal.items).toHaveLength(2);
    expect(duplicatedProposal.totalValue).toBe(originalProposal.totalValue);
    expect(proposalsRepository.proposals).toHaveLength(2);
  });

  it('should throw ResourceNotFoundError for non-existent proposal', async () => {
    await expect(() =>
      sut.execute({
        tenantId: 'tenant-1',
        id: 'non-existent',
        createdBy: 'user-1',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
