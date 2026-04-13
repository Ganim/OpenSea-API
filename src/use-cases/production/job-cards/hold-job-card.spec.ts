import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryJobCardsRepository } from '@/repositories/production/in-memory/in-memory-job-cards-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateJobCardUseCase } from './create-job-card';
import { HoldJobCardUseCase } from './hold-job-card';
import { StartJobCardUseCase } from './start-job-card';

let jobCardsRepository: InMemoryJobCardsRepository;
let createJobCard: CreateJobCardUseCase;
let startJobCard: StartJobCardUseCase;
let sut: HoldJobCardUseCase;

describe('HoldJobCardUseCase', () => {
  beforeEach(() => {
    jobCardsRepository = new InMemoryJobCardsRepository();
    createJobCard = new CreateJobCardUseCase(jobCardsRepository);
    startJobCard = new StartJobCardUseCase(jobCardsRepository);
    sut = new HoldJobCardUseCase(jobCardsRepository);
  });

  it('should put an in-progress job card on hold', async () => {
    const { jobCard: created } = await createJobCard.execute({
      productionOrderId: 'order-1',
      operationRoutingId: 'routing-1',
      quantityPlanned: 100,
    });

    await startJobCard.execute({
      id: created.id.toString(),
      tenantId: 'tenant-1',
    });

    const { jobCard } = await sut.execute({
      id: created.id.toString(),
      tenantId: 'tenant-1',
    });

    expect(jobCard.status).toBe('ON_HOLD');
  });

  it('should throw error if job card does not exist', async () => {
    await expect(() =>
      sut.execute({ id: 'non-existent-id', tenantId: 'tenant-1' }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw error if job card is not IN_PROGRESS', async () => {
    const { jobCard: created } = await createJobCard.execute({
      productionOrderId: 'order-1',
      operationRoutingId: 'routing-1',
      quantityPlanned: 100,
    });

    // Try to hold a PENDING job card
    await expect(() =>
      sut.execute({
        id: created.id.toString(),
        tenantId: 'tenant-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
