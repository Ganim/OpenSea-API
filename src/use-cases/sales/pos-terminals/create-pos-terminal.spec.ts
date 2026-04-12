vi.mock('@/lib/prisma', () => ({
  prisma: {
    posTerminalWarehouse: {
      createMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
  },
}));

import { InMemoryPosTerminalsRepository } from '@/repositories/sales/in-memory/in-memory-pos-terminals-repository';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CreatePosTerminalUseCase } from './create-pos-terminal';

let posTerminalsRepository: InMemoryPosTerminalsRepository;
let createPosTerminal: CreatePosTerminalUseCase;

describe('CreatePosTerminalUseCase', () => {
  beforeEach(() => {
    posTerminalsRepository = new InMemoryPosTerminalsRepository();
    createPosTerminal = new CreatePosTerminalUseCase(posTerminalsRepository);
  });

  it('should be able to create a POS terminal', async () => {
    const { terminal } = await createPosTerminal.execute({
      tenantId: 'tenant-1',
      terminalName: 'Caixa 01',
      mode: 'CASHIER',
      warehouseIds: ['warehouse-1'],
    });

    expect(terminal).toBeDefined();
    expect(terminal.terminalName).toBe('Caixa 01');
    expect(terminal.terminalCode).toBeTruthy();
    expect(terminal.mode).toBe('CASHIER');
    expect(terminal.isActive).toBe(true);
    expect(terminal.acceptsPendingOrders).toBe(false);
    expect(posTerminalsRepository.items).toHaveLength(1);
  });

  it('should be able to create a terminal with custom settings', async () => {
    const { terminal } = await createPosTerminal.execute({
      tenantId: 'tenant-1',
      terminalName: 'Totem Autoatendimento',
      mode: 'TOTEM',
      acceptsPendingOrders: true,
      warehouseIds: ['warehouse-2'],
      defaultPriceTableId: 'price-table-1',
      settings: { printReceipt: true, language: 'pt-BR' },
    });

    expect(terminal.mode).toBe('TOTEM');
    expect(terminal.totemCode).toBeTruthy();
    expect(terminal.acceptsPendingOrders).toBe(true);
    expect(terminal.defaultPriceTableId?.toString()).toBe('price-table-1');
    expect(terminal.settings).toEqual({
      printReceipt: true,
      language: 'pt-BR',
    });
  });

  it('should set requiresSession to false for SALES_ONLY mode', async () => {
    const { terminal } = await createPosTerminal.execute({
      tenantId: 'tenant-1',
      terminalName: 'Terminal Vendas',
      mode: 'SALES_ONLY',
    });

    expect(terminal.requiresSession).toBe(false);
    expect(terminal.allowAnonymous).toBe(false);
  });

  it('should set allowAnonymous to true for TOTEM mode', async () => {
    const { terminal } = await createPosTerminal.execute({
      tenantId: 'tenant-1',
      terminalName: 'Totem 01',
      mode: 'TOTEM',
    });

    expect(terminal.allowAnonymous).toBe(true);
    expect(terminal.totemCode).toBeTruthy();
  });

  it('should be able to create multiple terminals for the same tenant', async () => {
    await createPosTerminal.execute({
      tenantId: 'tenant-1',
      terminalName: 'Terminal A',
      mode: 'CASHIER',
      warehouseIds: ['warehouse-1'],
    });

    const { terminal } = await createPosTerminal.execute({
      tenantId: 'tenant-1',
      terminalName: 'Terminal B',
      mode: 'SALES_ONLY',
    });

    expect(terminal).toBeDefined();
    expect(posTerminalsRepository.items).toHaveLength(2);
  });
});
