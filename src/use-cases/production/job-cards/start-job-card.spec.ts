import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryJobCardsRepository } from '@/repositories/production/in-memory/in-memory-job-cards-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateJobCardUseCase } from './create-job-card';
import { StartJobCardUseCase } from './start-job-card';

let jobCardsRepository: InMemoryJobCardsRepository;
let createJobCard: CreateJobCardUseCase;
let sut: StartJobCardUseCase;

describe('StartJobCardUseCase', () => {
  beforeEach(() => {
    jobCardsRepository = new InMemoryJobCardsRepository();
    createJobCard = new CreateJobCardUseCase(jobCardsRepository);
    sut = new StartJobCardUseCase(jobCardsRepository);
  });

  it('should start a pending job card', async () => {
    const { jobCard: created } = await createJobCard.execute({
      productionOrderId: 'order-1',
      operationRoutingId: 'routing-1',
      quantityPlanned: 100,
    });

    const { jobCard } = await sut.execute({
      id: created.id.toString(),
      tenantId: 'tenant-1',
    });

    expect(jobCard.status).toBe('IN_PROGRESS');
    expect(jobCard.actualStart).toBeDefined();
  });

  it('should throw error if job card does not exist', async () => {
    await expect(() =>
      sut.execute({ id: 'non-existent-id', tenantId: 'tenant-1' }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw error if job card is not in PENDING status', async () => {
    const { jobCard: created } = await createJobCard.execute({
      productionOrderId: 'order-1',
      operationRoutingId: 'routing-1',
      quantityPlanned: 100,
    });

    // Start it first
    await sut.execute({
      id: created.id.toString(),
      tenantId: 'tenant-1',
    });

    // Try to start it again
    await expect(() =>
      sut.execute({
        id: created.id.toString(),
        tenantId: 'tenant-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
