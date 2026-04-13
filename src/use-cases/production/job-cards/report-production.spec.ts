import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryJobCardsRepository } from '@/repositories/production/in-memory/in-memory-job-cards-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateJobCardUseCase } from './create-job-card';
import { ReportProductionUseCase } from './report-production';
import { StartJobCardUseCase } from './start-job-card';

let jobCardsRepository: InMemoryJobCardsRepository;
let createJobCard: CreateJobCardUseCase;
let startJobCard: StartJobCardUseCase;
let sut: ReportProductionUseCase;

describe('ReportProductionUseCase', () => {
  beforeEach(() => {
    jobCardsRepository = new InMemoryJobCardsRepository();
    createJobCard = new CreateJobCardUseCase(jobCardsRepository);
    startJobCard = new StartJobCardUseCase(jobCardsRepository);
    sut = new ReportProductionUseCase(jobCardsRepository);
  });

  it('should report production on an in-progress job card', async () => {
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
      jobCardId: created.id.toString(),
      tenantId: 'tenant-1',
      operatorId: 'user-1',
      quantityGood: 80,
      quantityScrapped: 5,
      quantityRework: 3,
    });

    expect(jobCard.quantityCompleted).toBe(83); // 80 good + 3 rework
    expect(jobCard.quantityScrapped).toBe(5);
  });

  it('should accumulate production across multiple reports', async () => {
    const { jobCard: created } = await createJobCard.execute({
      productionOrderId: 'order-1',
      operationRoutingId: 'routing-1',
      quantityPlanned: 100,
    });

    await startJobCard.execute({
      id: created.id.toString(),
      tenantId: 'tenant-1',
    });

    await sut.execute({
      jobCardId: created.id.toString(),
      tenantId: 'tenant-1',
      operatorId: 'user-1',
      quantityGood: 30,
    });

    const { jobCard } = await sut.execute({
      jobCardId: created.id.toString(),
      tenantId: 'tenant-1',
      operatorId: 'user-1',
      quantityGood: 40,
      quantityScrapped: 2,
    });

    expect(jobCard.quantityCompleted).toBe(70); // 30 + 40
    expect(jobCard.quantityScrapped).toBe(2);
  });

  it('should throw error if job card does not exist', async () => {
    await expect(() =>
      sut.execute({
        jobCardId: 'non-existent-id',
        tenantId: 'tenant-1',
        operatorId: 'user-1',
        quantityGood: 10,
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw error if job card is not IN_PROGRESS', async () => {
    const { jobCard: created } = await createJobCard.execute({
      productionOrderId: 'order-1',
      operationRoutingId: 'routing-1',
      quantityPlanned: 100,
    });

    await expect(() =>
      sut.execute({
        jobCardId: created.id.toString(),
        tenantId: 'tenant-1',
        operatorId: 'user-1',
        quantityGood: 10,
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should throw error if quantities are negative', async () => {
    const { jobCard: created } = await createJobCard.execute({
      productionOrderId: 'order-1',
      operationRoutingId: 'routing-1',
      quantityPlanned: 100,
    });

    await startJobCard.execute({
      id: created.id.toString(),
      tenantId: 'tenant-1',
    });

    await expect(() =>
      sut.execute({
        jobCardId: created.id.toString(),
        tenantId: 'tenant-1',
        operatorId: 'user-1',
        quantityGood: -5,
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
