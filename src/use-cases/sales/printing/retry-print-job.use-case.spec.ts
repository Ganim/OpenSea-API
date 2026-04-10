import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PrintJob } from '@/entities/sales/print-job';
import { InMemoryPrintJobsRepository } from '@/repositories/sales/in-memory/in-memory-print-jobs-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { RetryPrintJobUseCase } from './retry-print-job.use-case';

let printJobsRepository: InMemoryPrintJobsRepository;
let sut: RetryPrintJobUseCase;

const TENANT_ID = 'tenant-01';

describe('RetryPrintJobUseCase', () => {
  beforeEach(() => {
    printJobsRepository = new InMemoryPrintJobsRepository();
    sut = new RetryPrintJobUseCase(printJobsRepository);
  });

  it('should create a new job from a failed job', async () => {
    const failedJob = PrintJob.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      printerId: new UniqueEntityID('printer-01'),
      type: 'LABEL',
      status: 'FAILED',
      content: 'label-content',
      copies: 3,
      printerName: 'DYMO 450',
    });

    await printJobsRepository.create(failedJob);

    const result = await sut.execute({
      tenantId: TENANT_ID,
      jobId: failedJob.id.toString(),
    });

    expect(result.jobId).toBeDefined();
    expect(result.jobId).not.toBe(failedJob.id.toString());
    expect(result.status).toBe('queued');
    expect(printJobsRepository.items).toHaveLength(2);

    const retriedJob = printJobsRepository.items[1];
    expect(retriedJob.status).toBe('QUEUED');
    expect(retriedJob.content).toBe('label-content');
    expect(retriedJob.copies).toBe(3);
    expect(retriedJob.printerName).toBe('DYMO 450');
  });

  it('should reject retry of non-failed job', async () => {
    const activeJob = PrintJob.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      printerId: new UniqueEntityID('printer-01'),
      type: 'LABEL',
      status: 'QUEUED',
      content: 'content',
    });

    await printJobsRepository.create(activeJob);

    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        jobId: activeJob.id.toString(),
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw ResourceNotFoundError for nonexistent job', async () => {
    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        jobId: 'nonexistent-job-id',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
