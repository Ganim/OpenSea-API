import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryProposalsRepository } from '@/repositories/sales/in-memory/in-memory-proposals-repository';
import { InMemoryQuotesRepository } from '@/repositories/sales/in-memory/in-memory-quotes-repository';
import { CreateProposalUseCase } from '@/use-cases/sales/proposals/create-proposal';
import { CreateQuoteUseCase } from '@/use-cases/sales/quotes/create-quote';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetTrackingStatsUseCase } from './get-tracking-stats';
import { RecordViewUseCase } from './record-view';

let quotesRepository: InMemoryQuotesRepository;
let proposalsRepository: InMemoryProposalsRepository;
let createQuoteUseCase: CreateQuoteUseCase;
let createProposalUseCase: CreateProposalUseCase;
let recordViewUseCase: RecordViewUseCase;
let sut: GetTrackingStatsUseCase;

describe('GetTrackingStatsUseCase', () => {
  beforeEach(() => {
    quotesRepository = new InMemoryQuotesRepository();
    proposalsRepository = new InMemoryProposalsRepository();
    createQuoteUseCase = new CreateQuoteUseCase(quotesRepository);
    createProposalUseCase = new CreateProposalUseCase(proposalsRepository);
    recordViewUseCase = new RecordViewUseCase(
      quotesRepository,
      proposalsRepository,
    );
    sut = new GetTrackingStatsUseCase(quotesRepository, proposalsRepository);
  });

  it('should return tracking stats for a quote with views', async () => {
    const { quote } = await createQuoteUseCase.execute({
      tenantId: 'tenant-1',
      customerId: 'customer-1',
      title: 'Test Quote',
      createdBy: 'user-1',
      items: [{ productName: 'Item A', quantity: 1, unitPrice: 100 }],
    });

    await recordViewUseCase.execute({
      entityType: 'quote',
      entityId: quote.id,
    });
    await recordViewUseCase.execute({
      entityType: 'quote',
      entityId: quote.id,
    });

    const { trackingStats } = await sut.execute({
      tenantId: 'tenant-1',
      entityType: 'quote',
      entityId: quote.id,
    });

    expect(trackingStats.viewCount).toBe(2);
    expect(trackingStats.viewedAt).toBeDefined();
    expect(trackingStats.lastViewedAt).toBeDefined();
  });

  it('should return zero views for an unviewed quote', async () => {
    const { quote } = await createQuoteUseCase.execute({
      tenantId: 'tenant-1',
      customerId: 'customer-1',
      title: 'Test Quote',
      createdBy: 'user-1',
      items: [{ productName: 'Item A', quantity: 1, unitPrice: 100 }],
    });

    const { trackingStats } = await sut.execute({
      tenantId: 'tenant-1',
      entityType: 'quote',
      entityId: quote.id,
    });

    expect(trackingStats.viewCount).toBe(0);
    expect(trackingStats.viewedAt).toBeUndefined();
    expect(trackingStats.lastViewedAt).toBeUndefined();
  });

  it('should return tracking stats for a proposal', async () => {
    const { proposal } = await createProposalUseCase.execute({
      tenantId: 'tenant-1',
      customerId: 'customer-1',
      title: 'Test Proposal',
      createdBy: 'user-1',
      items: [{ description: 'Service A', quantity: 1, unitPrice: 500 }],
    });

    await recordViewUseCase.execute({
      entityType: 'proposal',
      entityId: proposal.id,
    });

    const { trackingStats } = await sut.execute({
      tenantId: 'tenant-1',
      entityType: 'proposal',
      entityId: proposal.id,
    });

    expect(trackingStats.viewCount).toBe(1);
    expect(trackingStats.viewedAt).toBeDefined();
    expect(trackingStats.lastViewedAt).toBeDefined();
  });

  it('should throw ResourceNotFoundError for non-existent quote', async () => {
    await expect(() =>
      sut.execute({
        tenantId: 'tenant-1',
        entityType: 'quote',
        entityId: 'non-existent-id',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw ResourceNotFoundError for non-existent proposal', async () => {
    await expect(() =>
      sut.execute({
        tenantId: 'tenant-1',
        entityType: 'proposal',
        entityId: 'non-existent-id',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
