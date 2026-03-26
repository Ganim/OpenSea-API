import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { InMemoryProposalsRepository } from '@/repositories/sales/in-memory/in-memory-proposals-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateProposalUseCase } from './create-proposal';

let proposalsRepository: InMemoryProposalsRepository;
let sut: CreateProposalUseCase;

const validProposalInput = {
  tenantId: 'tenant-1',
  customerId: 'customer-1',
  title: 'ERP Implementation Proposal',
  description: 'Full ERP system implementation',
  createdBy: 'user-1',
  items: [
    {
      description: 'System Analysis',
      quantity: 40,
      unitPrice: 150,
    },
    {
      description: 'Development',
      quantity: 120,
      unitPrice: 200,
    },
  ],
};

describe('CreateProposalUseCase', () => {
  beforeEach(() => {
    proposalsRepository = new InMemoryProposalsRepository();
    sut = new CreateProposalUseCase(proposalsRepository);
  });

  it('should create a proposal with auto-calculated total', async () => {
    const { proposal } = await sut.execute(validProposalInput);

    expect(proposal.title).toBe('ERP Implementation Proposal');
    expect(proposal.status).toBe('DRAFT');
    expect(proposal.totalValue).toBe(40 * 150 + 120 * 200);
    expect(proposal.items).toHaveLength(2);
    expect(proposalsRepository.proposals).toHaveLength(1);
  });

  it('should throw if title is empty', async () => {
    await expect(() =>
      sut.execute({ ...validProposalInput, title: '' }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should throw if title exceeds 255 characters', async () => {
    await expect(() =>
      sut.execute({ ...validProposalInput, title: 'A'.repeat(256) }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should throw if items array is empty', async () => {
    await expect(() =>
      sut.execute({ ...validProposalInput, items: [] }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should throw if item quantity is zero', async () => {
    await expect(() =>
      sut.execute({
        ...validProposalInput,
        items: [{ description: 'Test', quantity: 0, unitPrice: 100 }],
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should throw if item unit price is negative', async () => {
    await expect(() =>
      sut.execute({
        ...validProposalInput,
        items: [{ description: 'Test', quantity: 1, unitPrice: -10 }],
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
