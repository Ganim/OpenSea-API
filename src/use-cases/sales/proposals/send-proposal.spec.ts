import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryProposalsRepository } from '@/repositories/sales/in-memory/in-memory-proposals-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateProposalUseCase } from './create-proposal';
import { SendProposalUseCase } from './send-proposal';

let proposalsRepository: InMemoryProposalsRepository;
let createProposalUseCase: CreateProposalUseCase;
let sut: SendProposalUseCase;

describe('SendProposalUseCase', () => {
  beforeEach(() => {
    proposalsRepository = new InMemoryProposalsRepository();
    createProposalUseCase = new CreateProposalUseCase(proposalsRepository);
    sut = new SendProposalUseCase(proposalsRepository);
  });

  it('should send a DRAFT proposal', async () => {
    const { proposal: createdProposal } = await createProposalUseCase.execute({
      tenantId: 'tenant-1',
      customerId: 'customer-1',
      title: 'Proposal to Send',
      createdBy: 'user-1',
      items: [{ description: 'Item A', quantity: 1, unitPrice: 100 }],
    });

    const { proposal } = await sut.execute({
      tenantId: 'tenant-1',
      id: createdProposal.id,
    });

    expect(proposal.status).toBe('SENT');
    expect(proposal.sentAt).toBeDefined();
  });

  it('should throw if proposal is not DRAFT', async () => {
    const { proposal: createdProposal } = await createProposalUseCase.execute({
      tenantId: 'tenant-1',
      customerId: 'customer-1',
      title: 'Already Sent',
      createdBy: 'user-1',
      items: [{ description: 'Item A', quantity: 1, unitPrice: 100 }],
    });

    proposalsRepository.proposals[0].status = 'SENT';

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
