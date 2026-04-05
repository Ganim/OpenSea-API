import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PosPrinter } from '@/entities/sales/pos-printer';
import { InMemoryPosPrintersRepository } from '@/repositories/sales/in-memory/in-memory-pos-printers-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { DeletePrinterUseCase } from './delete-printer.use-case';

let printersRepository: InMemoryPosPrintersRepository;
let sut: DeletePrinterUseCase;

describe('DeletePrinterUseCase', () => {
  beforeEach(() => {
    printersRepository = new InMemoryPosPrintersRepository();
    sut = new DeletePrinterUseCase(printersRepository);
  });

  it('should soft delete printer', async () => {
    const printer = PosPrinter.create({
      tenantId: new UniqueEntityID('tenant-1'),
      name: 'Printer A',
      type: 'THERMAL',
      connection: 'USB',
      deviceId: 'USB-A',
    });

    await printersRepository.create(printer);

    await sut.execute({
      tenantId: 'tenant-1',
      printerId: printer.id.toString(),
    });

    expect(printer.isActive).toBe(false);
    expect(printer.deletedAt).toBeDefined();
  });

  it('should throw when printer does not exist', async () => {
    await expect(() =>
      sut.execute({
        tenantId: 'tenant-1',
        printerId: 'printer-404',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
