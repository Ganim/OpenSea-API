import { InMemoryProposalsRepository } from '@/repositories/sales/in-memory/in-memory-proposals-repository';
import { InMemoryQuotesRepository } from '@/repositories/sales/in-memory/in-memory-quotes-repository';
import { CreateProposalUseCase } from '@/use-cases/sales/proposals/create-proposal';
import { CreateQuoteUseCase } from '@/use-cases/sales/quotes/create-quote';
import { beforeEach, describe, expect, it } from 'vitest';
import { RecordViewUseCase } from './record-view';

let quotesRepository: InMemoryQuotesRepository;
let proposalsRepository: InMemoryProposalsRepository;
let createQuoteUseCase: CreateQuoteUseCase;
let createProposalUseCase: CreateProposalUseCase;
let sut: RecordViewUseCase;

describe('RecordViewUseCase', () => {
  beforeEach(() => {
    quotesRepository = new InMemoryQuotesRepository();
    proposalsRepository = new InMemoryProposalsRepository();
    createQuoteUseCase = new CreateQuoteUseCase(quotesRepository);
    createProposalUseCase = new CreateProposalUseCase(proposalsRepository);
    sut = new RecordViewUseCase(quotesRepository, proposalsRepository);
  });

  it('should record a view for a quote', async () => {
    const { quote } = await createQuoteUseCase.execute({
      tenantId: 'tenant-1',
      customerId: 'customer-1',
      title: 'Test Quote',
      createdBy: 'user-1',
      items: [{ productName: 'Item A', quantity: 1, unitPrice: 100 }],
    });

    const { recorded } = await sut.execute({
      entityType: 'quote',
      entityId: quote.id,
    });

    expect(recorded).toBe(true);

    const updatedQuote = quotesRepository.quotes[0];
    expect(updatedQuote.viewCount).toBe(1);
    expect(updatedQuote.viewedAt).toBeDefined();
    expect(updatedQuote.lastViewedAt).toBeDefined();
  });

  it('should increment view count on subsequent views for a quote', async () => {
    const { quote } = await createQuoteUseCase.execute({
      tenantId: 'tenant-1',
      customerId: 'customer-1',
      title: 'Test Quote',
      createdBy: 'user-1',
      items: [{ productName: 'Item A', quantity: 1, unitPrice: 100 }],
    });

    await sut.execute({ entityType: 'quote', entityId: quote.id });
    await sut.execute({ entityType: 'quote', entityId: quote.id });
    await sut.execute({ entityType: 'quote', entityId: quote.id });

    const updatedQuote = quotesRepository.quotes[0];
    expect(updatedQuote.viewCount).toBe(3);
  });

  it('should record a view for a proposal', async () => {
    const { proposal } = await createProposalUseCase.execute({
      tenantId: 'tenant-1',
      customerId: 'customer-1',
      title: 'Test Proposal',
      createdBy: 'user-1',
      items: [{ description: 'Service A', quantity: 1, unitPrice: 500 }],
    });

    const { recorded } = await sut.execute({
      entityType: 'proposal',
      entityId: proposal.id,
    });

    expect(recorded).toBe(true);

    const updatedProposal = proposalsRepository.proposals[0];
    expect(updatedProposal.viewCount).toBe(1);
    expect(updatedProposal.viewedAt).toBeDefined();
    expect(updatedProposal.lastViewedAt).toBeDefined();
  });

  it('should return false for non-existent quote', async () => {
    const { recorded } = await sut.execute({
      entityType: 'quote',
      entityId: 'non-existent-id',
    });

    expect(recorded).toBe(false);
  });

  it('should return false for non-existent proposal', async () => {
    const { recorded } = await sut.execute({
      entityType: 'proposal',
      entityId: 'non-existent-id',
    });

    expect(recorded).toBe(false);
  });
});
