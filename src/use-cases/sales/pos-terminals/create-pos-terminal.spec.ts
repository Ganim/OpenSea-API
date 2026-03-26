import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { InMemoryPosTerminalsRepository } from '@/repositories/sales/in-memory/in-memory-pos-terminals-repository';
import { beforeEach, describe, expect, it } from 'vitest';
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
      name: 'Terminal Caixa 01',
      deviceId: 'device-001',
      mode: 'FAST_CHECKOUT',
      warehouseId: 'warehouse-1',
    });

    expect(terminal).toBeDefined();
    expect(terminal.name).toBe('Terminal Caixa 01');
    expect(terminal.deviceId).toBe('device-001');
    expect(terminal.mode).toBe('FAST_CHECKOUT');
    expect(terminal.warehouseId.toString()).toBe('warehouse-1');
    expect(terminal.isActive).toBe(true);
    expect(terminal.cashierMode).toBe('INTEGRATED');
    expect(terminal.acceptsPendingOrders).toBe(false);
    expect(posTerminalsRepository.items).toHaveLength(1);
  });

  it('should be able to create a terminal with custom settings', async () => {
    const { terminal } = await createPosTerminal.execute({
      tenantId: 'tenant-1',
      name: 'Terminal Self-Service',
      deviceId: 'kiosk-001',
      mode: 'SELF_SERVICE',
      cashierMode: 'SEPARATED',
      acceptsPendingOrders: true,
      warehouseId: 'warehouse-2',
      defaultPriceTableId: 'price-table-1',
      settings: { printReceipt: true, language: 'pt-BR' },
    });

    expect(terminal.mode).toBe('SELF_SERVICE');
    expect(terminal.cashierMode).toBe('SEPARATED');
    expect(terminal.acceptsPendingOrders).toBe(true);
    expect(terminal.defaultPriceTableId?.toString()).toBe('price-table-1');
    expect(terminal.settings).toEqual({
      printReceipt: true,
      language: 'pt-BR',
    });
  });

  it('should not allow duplicate device IDs within the same tenant', async () => {
    await createPosTerminal.execute({
      tenantId: 'tenant-1',
      name: 'Terminal A',
      deviceId: 'device-dup',
      mode: 'FAST_CHECKOUT',
      warehouseId: 'warehouse-1',
    });

    await expect(() =>
      createPosTerminal.execute({
        tenantId: 'tenant-1',
        name: 'Terminal B',
        deviceId: 'device-dup',
        mode: 'CONSULTIVE',
        warehouseId: 'warehouse-1',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should allow same device ID in different tenants', async () => {
    await createPosTerminal.execute({
      tenantId: 'tenant-1',
      name: 'Terminal Tenant 1',
      deviceId: 'shared-device',
      mode: 'FAST_CHECKOUT',
      warehouseId: 'warehouse-1',
    });

    const { terminal } = await createPosTerminal.execute({
      tenantId: 'tenant-2',
      name: 'Terminal Tenant 2',
      deviceId: 'shared-device',
      mode: 'FAST_CHECKOUT',
      warehouseId: 'warehouse-2',
    });

    expect(terminal).toBeDefined();
    expect(posTerminalsRepository.items).toHaveLength(2);
  });
});
