vi.mock('@/lib/prisma', () => ({
  prisma: {
    posTerminalWarehouse: {
      createMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
  },
}));

import { InMemoryPosDevicePairingsRepository } from '@/repositories/sales/in-memory/in-memory-pos-device-pairings-repository';
import { InMemoryPosTerminalsRepository } from '@/repositories/sales/in-memory/in-memory-pos-terminals-repository';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CreatePosTerminalUseCase } from './create-pos-terminal';
import { ListPosTerminalsUseCase } from './list-pos-terminals';

let posTerminalsRepository: InMemoryPosTerminalsRepository;
let pairingsRepository: InMemoryPosDevicePairingsRepository;
let createPosTerminal: CreatePosTerminalUseCase;
let listPosTerminals: ListPosTerminalsUseCase;

describe('ListPosTerminalsUseCase', () => {
  beforeEach(() => {
    posTerminalsRepository = new InMemoryPosTerminalsRepository();
    pairingsRepository = new InMemoryPosDevicePairingsRepository();
    createPosTerminal = new CreatePosTerminalUseCase(posTerminalsRepository);
    listPosTerminals = new ListPosTerminalsUseCase(
      posTerminalsRepository,
      pairingsRepository,
    );
  });

  it('should list all terminals for a tenant', async () => {
    await createPosTerminal.execute({
      tenantId: 'tenant-1',
      terminalName: 'Terminal 01',
      mode: 'CASHIER',
      warehouseIds: ['warehouse-1'],
    });

    await createPosTerminal.execute({
      tenantId: 'tenant-1',
      terminalName: 'Terminal 02',
      mode: 'SALES_ONLY',
    });

    const result = await listPosTerminals.execute({
      tenantId: 'tenant-1',
      page: 1,
      limit: 20,
    });

    expect(result.terminals).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.totalPages).toBe(1);
  });

  it('should paginate results', async () => {
    for (let i = 1; i <= 5; i++) {
      await createPosTerminal.execute({
        tenantId: 'tenant-1',
        terminalName: `Terminal ${i}`,
        mode: 'CASHIER',
        warehouseIds: ['warehouse-1'],
      });
    }

    const firstPage = await listPosTerminals.execute({
      tenantId: 'tenant-1',
      page: 1,
      limit: 2,
    });

    expect(firstPage.terminals).toHaveLength(2);
    expect(firstPage.total).toBe(5);
    expect(firstPage.totalPages).toBe(3);

    const secondPage = await listPosTerminals.execute({
      tenantId: 'tenant-1',
      page: 2,
      limit: 2,
    });

    expect(secondPage.terminals).toHaveLength(2);
  });

  it('should filter by search term', async () => {
    await createPosTerminal.execute({
      tenantId: 'tenant-1',
      terminalName: 'Caixa Principal',
      mode: 'CASHIER',
      warehouseIds: ['warehouse-1'],
    });

    await createPosTerminal.execute({
      tenantId: 'tenant-1',
      terminalName: 'Totem Autoatendimento',
      mode: 'TOTEM',
    });

    const result = await listPosTerminals.execute({
      tenantId: 'tenant-1',
      page: 1,
      limit: 20,
      search: 'Caixa',
    });

    expect(result.terminals).toHaveLength(1);
    expect(result.terminals[0].terminalName).toBe('Caixa Principal');
  });

  it('should not return terminals from other tenants', async () => {
    await createPosTerminal.execute({
      tenantId: 'tenant-1',
      terminalName: 'Terminal Tenant 1',
      mode: 'CASHIER',
      warehouseIds: ['warehouse-1'],
    });

    await createPosTerminal.execute({
      tenantId: 'tenant-2',
      terminalName: 'Terminal Tenant 2',
      mode: 'CASHIER',
      warehouseIds: ['warehouse-2'],
    });

    const result = await listPosTerminals.execute({
      tenantId: 'tenant-1',
      page: 1,
      limit: 20,
    });

    expect(result.terminals).toHaveLength(1);
    expect(result.terminals[0].terminalName).toBe('Terminal Tenant 1');
  });

  it('should return empty list when no terminals exist', async () => {
    const result = await listPosTerminals.execute({
      tenantId: 'tenant-1',
      page: 1,
      limit: 20,
    });

    expect(result.terminals).toHaveLength(0);
    expect(result.total).toBe(0);
    expect(result.totalPages).toBe(0);
  });
});
