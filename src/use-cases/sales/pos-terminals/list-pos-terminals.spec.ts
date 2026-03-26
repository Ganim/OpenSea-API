import { InMemoryPosTerminalsRepository } from '@/repositories/sales/in-memory/in-memory-pos-terminals-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreatePosTerminalUseCase } from './create-pos-terminal';
import { ListPosTerminalsUseCase } from './list-pos-terminals';

let posTerminalsRepository: InMemoryPosTerminalsRepository;
let createPosTerminal: CreatePosTerminalUseCase;
let listPosTerminals: ListPosTerminalsUseCase;

describe('ListPosTerminalsUseCase', () => {
  beforeEach(() => {
    posTerminalsRepository = new InMemoryPosTerminalsRepository();
    createPosTerminal = new CreatePosTerminalUseCase(posTerminalsRepository);
    listPosTerminals = new ListPosTerminalsUseCase(posTerminalsRepository);
  });

  it('should list all terminals for a tenant', async () => {
    await createPosTerminal.execute({
      tenantId: 'tenant-1',
      name: 'Terminal 01',
      deviceId: 'dev-001',
      mode: 'FAST_CHECKOUT',
      warehouseId: 'warehouse-1',
    });

    await createPosTerminal.execute({
      tenantId: 'tenant-1',
      name: 'Terminal 02',
      deviceId: 'dev-002',
      mode: 'CONSULTIVE',
      warehouseId: 'warehouse-1',
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
        name: `Terminal ${i}`,
        deviceId: `dev-${i}`,
        mode: 'FAST_CHECKOUT',
        warehouseId: 'warehouse-1',
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
      name: 'Caixa Principal',
      deviceId: 'dev-001',
      mode: 'FAST_CHECKOUT',
      warehouseId: 'warehouse-1',
    });

    await createPosTerminal.execute({
      tenantId: 'tenant-1',
      name: 'Totem Self-Service',
      deviceId: 'dev-002',
      mode: 'SELF_SERVICE',
      warehouseId: 'warehouse-1',
    });

    const result = await listPosTerminals.execute({
      tenantId: 'tenant-1',
      page: 1,
      limit: 20,
      search: 'Caixa',
    });

    expect(result.terminals).toHaveLength(1);
    expect(result.terminals[0].name).toBe('Caixa Principal');
  });

  it('should not return terminals from other tenants', async () => {
    await createPosTerminal.execute({
      tenantId: 'tenant-1',
      name: 'Terminal Tenant 1',
      deviceId: 'dev-001',
      mode: 'FAST_CHECKOUT',
      warehouseId: 'warehouse-1',
    });

    await createPosTerminal.execute({
      tenantId: 'tenant-2',
      name: 'Terminal Tenant 2',
      deviceId: 'dev-002',
      mode: 'FAST_CHECKOUT',
      warehouseId: 'warehouse-2',
    });

    const result = await listPosTerminals.execute({
      tenantId: 'tenant-1',
      page: 1,
      limit: 20,
    });

    expect(result.terminals).toHaveLength(1);
    expect(result.terminals[0].name).toBe('Terminal Tenant 1');
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
