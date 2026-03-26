import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryProposalsRepository } from '@/repositories/sales/in-memory/in-memory-proposals-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateProposalUseCase } from './create-proposal';
import { DeleteProposalUseCase } from './delete-proposal';

let proposalsRepository: InMemoryProposalsRepository;
let createProposalUseCase: CreateProposalUseCase;
let sut: DeleteProposalUseCase;

describe('DeleteProposalUseCase', () => {
  beforeEach(() => {
    proposalsRepository = new InMemoryProposalsRepository();
    createProposalUseCase = new CreateProposalUseCase(proposalsRepository);
    sut = new DeleteProposalUseCase(proposalsRepository);
  });

  it('should soft delete a DRAFT proposal', async () => {
    const { proposal } = await createProposalUseCase.execute({
      tenantId: 'tenant-1',
      customerId: 'customer-1',
      title: 'Proposal to Delete',
      createdBy: 'user-1',
      items: [{ description: 'Item A', quantity: 1, unitPrice: 100 }],
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      id: proposal.id,
    });

    expect(result.message).toBe('Proposal deleted successfully.');
    expect(proposalsRepository.proposals[0].isDeleted).toBe(true);
  });

  it('should soft delete a REJECTED proposal', async () => {
    const { proposal } = await createProposalUseCase.execute({
      tenantId: 'tenant-1',
      customerId: 'customer-1',
      title: 'Rejected Proposal',
      createdBy: 'user-1',
      items: [{ description: 'Item A', quantity: 1, unitPrice: 100 }],
    });

    proposalsRepository.proposals[0].status = 'REJECTED';

    const result = await sut.execute({
      tenantId: 'tenant-1',
      id: proposal.id,
    });
    expect(result.message).toBe('Proposal deleted successfully.');
  });

  it('should throw ResourceNotFoundError for non-existent proposal', async () => {
    await expect(() =>
      sut.execute({ tenantId: 'tenant-1', id: 'non-existent' }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw BadRequestError if proposal is SENT', async () => {
    const { proposal } = await createProposalUseCase.execute({
      tenantId: 'tenant-1',
      customerId: 'customer-1',
      title: 'Sent Proposal',
      createdBy: 'user-1',
      items: [{ description: 'Item A', quantity: 1, unitPrice: 100 }],
    });

    proposalsRepository.proposals[0].status = 'SENT';

    await expect(() =>
      sut.execute({ tenantId: 'tenant-1', id: proposal.id }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
