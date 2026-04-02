import { InMemoryPosTerminalsRepository } from '@/repositories/sales/in-memory/in-memory-pos-terminals-repository';
import { PosTerminal } from '@/entities/sales/pos-terminal';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { beforeEach, describe, expect, it } from 'vitest';
import { UpdatePosTerminalUseCase } from './update-pos-terminal';

let posTerminalsRepository: InMemoryPosTerminalsRepository;
let sut: UpdatePosTerminalUseCase;

describe('UpdatePosTerminalUseCase', () => {
  beforeEach(() => {
    posTerminalsRepository = new InMemoryPosTerminalsRepository();
    sut = new UpdatePosTerminalUseCase(posTerminalsRepository);
  });

  it('should update terminal fields', async () => {
    const terminal = PosTerminal.create({
      tenantId: new UniqueEntityID('tenant-1'),
      name: 'Terminal 1',
      deviceId: 'device-1',
      mode: 'FAST_CHECKOUT',
      warehouseId: new UniqueEntityID('warehouse-1'),
    });
    await posTerminalsRepository.create(terminal);

    const result = await sut.execute({
      tenantId: 'tenant-1',
      terminalId: terminal.id.toString(),
      name: 'Updated Terminal',
      mode: 'CONSULTIVE',
      isActive: false,
    });

    expect(result.terminal.name).toBe('Updated Terminal');
    expect(result.terminal.mode).toBe('CONSULTIVE');
    expect(result.terminal.isActive).toBe(false);
  });

  it('should throw if terminal is not found', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        terminalId: 'non-existent',
        name: 'Test',
      }),
    ).rejects.toThrow('Terminal not found.');
  });

  it('should update defaultPriceTableId to null', async () => {
    const terminal = PosTerminal.create({
      tenantId: new UniqueEntityID('tenant-1'),
      name: 'Terminal 1',
      deviceId: 'device-1',
      mode: 'FAST_CHECKOUT',
      warehouseId: new UniqueEntityID('warehouse-1'),
      defaultPriceTableId: new UniqueEntityID('price-table-1'),
    });
    await posTerminalsRepository.create(terminal);

    const result = await sut.execute({
      tenantId: 'tenant-1',
      terminalId: terminal.id.toString(),
      defaultPriceTableId: null,
    });

    expect(result.terminal.defaultPriceTableId).toBeUndefined();
  });

  it('should only update provided fields', async () => {
    const terminal = PosTerminal.create({
      tenantId: new UniqueEntityID('tenant-1'),
      name: 'Terminal 1',
      deviceId: 'device-1',
      mode: 'FAST_CHECKOUT',
      warehouseId: new UniqueEntityID('warehouse-1'),
    });
    await posTerminalsRepository.create(terminal);

    const result = await sut.execute({
      tenantId: 'tenant-1',
      terminalId: terminal.id.toString(),
      name: 'Updated Name',
    });

    expect(result.terminal.name).toBe('Updated Name');
    expect(result.terminal.mode).toBe('FAST_CHECKOUT');
    expect(result.terminal.deviceId).toBe('device-1');
  });
});
