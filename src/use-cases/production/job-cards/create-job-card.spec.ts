import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { InMemoryJobCardsRepository } from '@/repositories/production/in-memory/in-memory-job-cards-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateJobCardUseCase } from './create-job-card';

let jobCardsRepository: InMemoryJobCardsRepository;
let sut: CreateJobCardUseCase;

describe('CreateJobCardUseCase', () => {
  beforeEach(() => {
    jobCardsRepository = new InMemoryJobCardsRepository();
    sut = new CreateJobCardUseCase(jobCardsRepository);
  });

  it('should create a job card', async () => {
    const { jobCard } = await sut.execute({
      productionOrderId: 'order-1',
      operationRoutingId: 'routing-1',
      quantityPlanned: 100,
    });

    expect(jobCard.id.toString()).toEqual(expect.any(String));
    expect(jobCard.productionOrderId.toString()).toBe('order-1');
    expect(jobCard.operationRoutingId.toString()).toBe('routing-1');
    expect(jobCard.quantityPlanned).toBe(100);
    expect(jobCard.status).toBe('PENDING');
    expect(jobCard.quantityCompleted).toBe(0);
    expect(jobCard.quantityScrapped).toBe(0);
    expect(jobCard.barcode).toEqual(expect.any(String));
  });

  it('should create a job card with workstation', async () => {
    const { jobCard } = await sut.execute({
      productionOrderId: 'order-1',
      operationRoutingId: 'routing-1',
      workstationId: 'ws-1',
      quantityPlanned: 50,
    });

    expect(jobCard.workstationId?.toString()).toBe('ws-1');
  });

  it('should create a job card with scheduled dates', async () => {
    const scheduledStart = new Date('2026-01-15T08:00:00Z');
    const scheduledEnd = new Date('2026-01-15T16:00:00Z');

    const { jobCard } = await sut.execute({
      productionOrderId: 'order-1',
      operationRoutingId: 'routing-1',
      quantityPlanned: 100,
      scheduledStart,
      scheduledEnd,
    });

    expect(jobCard.scheduledStart).toEqual(scheduledStart);
    expect(jobCard.scheduledEnd).toEqual(scheduledEnd);
  });

  it('should throw error if quantity is zero or negative', async () => {
    await expect(() =>
      sut.execute({
        productionOrderId: 'order-1',
        operationRoutingId: 'routing-1',
        quantityPlanned: 0,
      }),
    ).rejects.toBeInstanceOf(BadRequestError);

    await expect(() =>
      sut.execute({
        productionOrderId: 'order-1',
        operationRoutingId: 'routing-1',
        quantityPlanned: -5,
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should generate a unique barcode starting with JC-', async () => {
    const { jobCard } = await sut.execute({
      productionOrderId: 'order-1',
      operationRoutingId: 'routing-1',
      quantityPlanned: 100,
    });

    expect(jobCard.barcode).toMatch(/^JC-/);
  });
});
