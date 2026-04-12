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
      terminalName: 'Terminal 1',
      terminalCode: 'ABCD1234',
      mode: 'CASHIER',
    });
    await posTerminalsRepository.create(terminal);

    const result = await sut.execute({
      tenantId: 'tenant-1',
      terminalId: terminal.id.toString(),
      terminalName: 'Terminal Atualizado',
      mode: 'SALES_WITH_CHECKOUT',
      isActive: false,
    });

    expect(result.terminal.terminalName).toBe('Terminal Atualizado');
    expect(result.terminal.mode).toBe('SALES_WITH_CHECKOUT');
    expect(result.terminal.isActive).toBe(false);
  });

  it('should throw if terminal is not found', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        terminalId: 'non-existent',
        terminalName: 'Test',
      }),
    ).rejects.toThrow('Terminal not found.');
  });

  it('should update defaultPriceTableId to null', async () => {
    const terminal = PosTerminal.create({
      tenantId: new UniqueEntityID('tenant-1'),
      terminalName: 'Terminal 1',
      terminalCode: 'ABCD1234',
      mode: 'CASHIER',
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
      terminalName: 'Terminal 1',
      terminalCode: 'ABCD1234',
      mode: 'CASHIER',
    });
    await posTerminalsRepository.create(terminal);

    const result = await sut.execute({
      tenantId: 'tenant-1',
      terminalId: terminal.id.toString(),
      terminalName: 'Nome Atualizado',
    });

    expect(result.terminal.terminalName).toBe('Nome Atualizado');
    expect(result.terminal.mode).toBe('CASHIER');
    expect(result.terminal.terminalCode).toBe('ABCD1234');
  });
});
