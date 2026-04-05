import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PrintJob } from '@/entities/sales/print-job';
import { InMemoryPrintJobsRepository } from '@/repositories/sales/in-memory/in-memory-print-jobs-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CancelPrintJobUseCase } from './cancel-print-job.use-case';

let printJobsRepository: InMemoryPrintJobsRepository;
let sut: CancelPrintJobUseCase;

describe('CancelPrintJobUseCase', () => {
  beforeEach(() => {
    printJobsRepository = new InMemoryPrintJobsRepository();
    sut = new CancelPrintJobUseCase(printJobsRepository);
  });

  it('should cancel a print job', async () => {
    const printJob = PrintJob.create({
      tenantId: new UniqueEntityID('tenant-1'),
      printerId: new UniqueEntityID('printer-1'),
      orderId: 'order-1',
      type: 'RECEIPT',
      content: 'dGVzdA==',
    });

    await printJobsRepository.create(printJob);

    await sut.execute({
      tenantId: 'tenant-1',
      jobId: printJob.id.toString(),
    });

    expect(printJob.status).toBe('CANCELLED');
  });

  it('should throw when print job does not exist', async () => {
    await expect(() =>
      sut.execute({ tenantId: 'tenant-1', jobId: 'missing' }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
