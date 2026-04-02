import { InMemoryPosTerminalsRepository } from '@/repositories/sales/in-memory/in-memory-pos-terminals-repository';
import { PosTerminal } from '@/entities/sales/pos-terminal';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { beforeEach, describe, expect, it } from 'vitest';
import { DeletePosTerminalUseCase } from './delete-pos-terminal';

let posTerminalsRepository: InMemoryPosTerminalsRepository;
let sut: DeletePosTerminalUseCase;

describe('DeletePosTerminalUseCase', () => {
  beforeEach(() => {
    posTerminalsRepository = new InMemoryPosTerminalsRepository();
    sut = new DeletePosTerminalUseCase(posTerminalsRepository);
  });

  it('should delete an existing terminal', async () => {
    const terminal = PosTerminal.create({
      tenantId: new UniqueEntityID('tenant-1'),
      name: 'Terminal 1',
      deviceId: 'device-1',
      mode: 'FAST_CHECKOUT',
      warehouseId: new UniqueEntityID('warehouse-1'),
    });
    await posTerminalsRepository.create(terminal);

    await sut.execute({
      tenantId: 'tenant-1',
      terminalId: terminal.id.toString(),
    });

    expect(posTerminalsRepository.items).toHaveLength(0);
  });

  it('should throw if terminal is not found', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        terminalId: 'non-existent',
      }),
    ).rejects.toThrow('Terminal not found.');
  });

  it('should not delete terminal from another tenant', async () => {
    const terminal = PosTerminal.create({
      tenantId: new UniqueEntityID('tenant-1'),
      name: 'Terminal 1',
      deviceId: 'device-1',
      mode: 'FAST_CHECKOUT',
      warehouseId: new UniqueEntityID('warehouse-1'),
    });
    await posTerminalsRepository.create(terminal);

    await expect(
      sut.execute({
        tenantId: 'tenant-2',
        terminalId: terminal.id.toString(),
      }),
    ).rejects.toThrow('Terminal not found.');
  });
});
