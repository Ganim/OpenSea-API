import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PosPrinter } from '@/entities/sales/pos-printer';
import { InMemoryPosPrintersRepository } from '@/repositories/sales/in-memory/in-memory-pos-printers-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListPrintersUseCase } from './list-printers.use-case';

let printersRepository: InMemoryPosPrintersRepository;
let sut: ListPrintersUseCase;

describe('ListPrintersUseCase', () => {
  beforeEach(() => {
    printersRepository = new InMemoryPosPrintersRepository();
    sut = new ListPrintersUseCase(printersRepository);
  });

  it('should list tenant printers', async () => {
    await printersRepository.create(
      PosPrinter.create({
        tenantId: new UniqueEntityID('tenant-1'),
        name: 'Printer A',
        type: 'THERMAL',
        connection: 'USB',
        deviceId: 'USB-A',
      }),
    );

    await printersRepository.create(
      PosPrinter.create({
        tenantId: new UniqueEntityID('tenant-2'),
        name: 'Printer B',
        type: 'THERMAL',
        connection: 'USB',
        deviceId: 'USB-B',
      }),
    );

    const result = await sut.execute({ tenantId: 'tenant-1' });

    expect(result.printers).toHaveLength(1);
    expect(result.printers[0].name).toBe('Printer A');
  });
});
