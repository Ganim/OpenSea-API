import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PrintJob } from '@/entities/sales/print-job';
import { InMemoryPrintJobsRepository } from '@/repositories/sales/in-memory/in-memory-print-jobs-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListPrintJobsUseCase } from './list-print-jobs.use-case';

let printJobsRepository: InMemoryPrintJobsRepository;
let sut: ListPrintJobsUseCase;

const TENANT_ID = 'tenant-01';

describe('ListPrintJobsUseCase', () => {
  beforeEach(() => {
    printJobsRepository = new InMemoryPrintJobsRepository();
    sut = new ListPrintJobsUseCase(printJobsRepository);
  });

  it('should return paginated print jobs', async () => {
    for (let i = 0; i < 25; i++) {
      await printJobsRepository.create(
        PrintJob.create({
          tenantId: new UniqueEntityID(TENANT_ID),
          printerId: new UniqueEntityID('printer-01'),
          type: 'LABEL',
          content: `content-${i}`,
        }),
      );
    }

    const result = await sut.execute({
      tenantId: TENANT_ID,
      page: 1,
      limit: 10,
    });

    expect(result.jobs).toHaveLength(10);
    expect(result.meta.total).toBe(25);
    expect(result.meta.page).toBe(1);
    expect(result.meta.limit).toBe(10);
    expect(result.meta.pages).toBe(3);
  });

  it('should filter by status', async () => {
    await printJobsRepository.create(
      PrintJob.create({
        tenantId: new UniqueEntityID(TENANT_ID),
        printerId: new UniqueEntityID('printer-01'),
        type: 'LABEL',
        content: 'content-queued',
        status: 'QUEUED',
      }),
    );

    await printJobsRepository.create(
      PrintJob.create({
        tenantId: new UniqueEntityID(TENANT_ID),
        printerId: new UniqueEntityID('printer-01'),
        type: 'LABEL',
        content: 'content-failed',
        status: 'FAILED',
      }),
    );

    const result = await sut.execute({
      tenantId: TENANT_ID,
      status: 'QUEUED',
    });

    expect(result.jobs).toHaveLength(1);
    expect(result.jobs[0].status).toBe('QUEUED');
  });

  it('should return empty list when no jobs exist', async () => {
    const result = await sut.execute({ tenantId: TENANT_ID });

    expect(result.jobs).toHaveLength(0);
    expect(result.meta.total).toBe(0);
  });
});
