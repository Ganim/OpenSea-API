import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PosPrinter } from '@/entities/sales/pos-printer';
import { InMemoryPosPrintersRepository } from '@/repositories/sales/in-memory/in-memory-pos-printers-repository';
import { InMemoryPrintJobsRepository } from '@/repositories/sales/in-memory/in-memory-print-jobs-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateLabelPrintJobUseCase } from './create-label-print-job.use-case';

let posPrintersRepository: InMemoryPosPrintersRepository;
let printJobsRepository: InMemoryPrintJobsRepository;
let sut: CreateLabelPrintJobUseCase;

const TENANT_ID = 'tenant-01';

describe('CreateLabelPrintJobUseCase', () => {
  beforeEach(() => {
    posPrintersRepository = new InMemoryPosPrintersRepository();
    printJobsRepository = new InMemoryPrintJobsRepository();
    sut = new CreateLabelPrintJobUseCase(
      posPrintersRepository,
      printJobsRepository,
    );
  });

  it('should create a label print job', async () => {
    const printer = PosPrinter.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      name: 'Label Printer',
      type: 'LABEL',
      connection: 'USB',
      osName: 'DYMO LabelWriter',
    });

    await posPrintersRepository.create(printer);

    const result = await sut.execute({
      tenantId: TENANT_ID,
      printerId: printer.id.toString(),
      content: 'base64pdfcontent',
      copies: 2,
    });

    expect(result.jobId).toBeDefined();
    expect(result.status).toBe('queued');
    expect(printJobsRepository.items).toHaveLength(1);
    expect(printJobsRepository.items[0].type).toBe('LABEL');
    expect(printJobsRepository.items[0].copies).toBe(2);
    expect(printJobsRepository.items[0].printerName).toBe('DYMO LabelWriter');
  });

  it('should use printer name when osName is not set', async () => {
    const printer = PosPrinter.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      name: 'Fallback Name',
      type: 'LABEL',
      connection: 'USB',
    });

    await posPrintersRepository.create(printer);

    await sut.execute({
      tenantId: TENANT_ID,
      printerId: printer.id.toString(),
      content: 'base64content',
    });

    expect(printJobsRepository.items[0].printerName).toBe('Fallback Name');
  });

  it('should throw ResourceNotFoundError for nonexistent printer', async () => {
    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        printerId: 'nonexistent-printer',
        content: 'base64content',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should reject content exceeding 10MB', async () => {
    const printer = PosPrinter.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      name: 'Printer',
      type: 'LABEL',
      connection: 'USB',
    });

    await posPrintersRepository.create(printer);

    const oversizedContent = 'x'.repeat(11 * 1024 * 1024);

    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        printerId: printer.id.toString(),
        content: oversizedContent,
      }),
    ).rejects.toThrow(BadRequestError);
  });
});
