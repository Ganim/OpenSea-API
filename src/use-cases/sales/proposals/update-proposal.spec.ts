import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryProposalsRepository } from '@/repositories/sales/in-memory/in-memory-proposals-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateProposalUseCase } from './create-proposal';
import { UpdateProposalUseCase } from './update-proposal';

let proposalsRepository: InMemoryProposalsRepository;
let createProposalUseCase: CreateProposalUseCase;
let sut: UpdateProposalUseCase;

describe('UpdateProposalUseCase', () => {
  beforeEach(() => {
    proposalsRepository = new InMemoryProposalsRepository();
    createProposalUseCase = new CreateProposalUseCase(proposalsRepository);
    sut = new UpdateProposalUseCase(proposalsRepository);
  });

  it('should update a DRAFT proposal', async () => {
    const { proposal: createdProposal } = await createProposalUseCase.execute({
      tenantId: 'tenant-1',
      customerId: 'customer-1',
      title: 'Original Title',
      createdBy: 'user-1',
      items: [{ description: 'Item A', quantity: 1, unitPrice: 100 }],
    });

    const { proposal } = await sut.execute({
      tenantId: 'tenant-1',
      id: createdProposal.id,
      title: 'Updated Title',
    });

    expect(proposal.title).toBe('Updated Title');
  });

  it('should recalculate totalValue when items are updated', async () => {
    const { proposal: createdProposal } = await createProposalUseCase.execute({
      tenantId: 'tenant-1',
      customerId: 'customer-1',
      title: 'Proposal',
      createdBy: 'user-1',
      items: [{ description: 'Item A', quantity: 1, unitPrice: 100 }],
    });

    const { proposal } = await sut.execute({
      tenantId: 'tenant-1',
      id: createdProposal.id,
      items: [
        { description: 'Item B', quantity: 2, unitPrice: 200 },
        { description: 'Item C', quantity: 3, unitPrice: 50 },
      ],
    });

    expect(proposal.totalValue).toBe(550);
    expect(proposal.items).toHaveLength(2);
  });

  it('should throw ResourceNotFoundError for non-existent proposal', async () => {
    await expect(() =>
      sut.execute({
        tenantId: 'tenant-1',
        id: 'non-existent',
        title: 'Test',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw if proposal is not in DRAFT status', async () => {
    const { proposal: createdProposal } = await createProposalUseCase.execute({
      tenantId: 'tenant-1',
      customerId: 'customer-1',
      title: 'Proposal',
      createdBy: 'user-1',
      items: [{ description: 'Item A', quantity: 1, unitPrice: 100 }],
    });

    proposalsRepository.proposals[0].status = 'SENT';

    await expect(() =>
      sut.execute({
        tenantId: 'tenant-1',
        id: createdProposal.id,
        title: 'Updated',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
