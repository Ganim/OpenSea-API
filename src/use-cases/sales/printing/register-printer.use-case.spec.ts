import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryTenantsRepository } from '@/repositories/core/in-memory/in-memory-tenants-repository';
import { InMemoryPosPrintersRepository } from '@/repositories/sales/in-memory/in-memory-pos-printers-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  RegisterPrinterUseCase,
  type PrinterConnectionValidator,
} from './register-printer.use-case';

class FailingConnectionValidator implements PrinterConnectionValidator {
  async validate(): Promise<boolean> {
    return false;
  }
}

let tenantsRepository: InMemoryTenantsRepository;
let printersRepository: InMemoryPosPrintersRepository;
let sut: RegisterPrinterUseCase;

describe('RegisterPrinterUseCase', () => {
  beforeEach(() => {
    tenantsRepository = new InMemoryTenantsRepository();
    printersRepository = new InMemoryPosPrintersRepository();
    sut = new RegisterPrinterUseCase(tenantsRepository, printersRepository);
  });

  it('should register a network printer', async () => {
    const tenant = await tenantsRepository.create({
      name: 'Tenant Printer',
      slug: 'tenant-printer',
    });

    const result = await sut.execute({
      tenantId: tenant.id.toString(),
      name: 'Caixa 01',
      type: 'THERMAL',
      connection: 'NETWORK',
      ipAddress: '192.168.0.100',
      port: 9100,
      isDefault: true,
    });

    expect(result.printerId).toBeDefined();
    expect(printersRepository.items).toHaveLength(1);
    expect(printersRepository.items[0].isDefault).toBe(true);
  });

  it('should fail when tenant does not exist', async () => {
    await expect(() =>
      sut.execute({
        tenantId: 'missing-tenant',
        name: 'Caixa 01',
        type: 'THERMAL',
        connection: 'USB',
        deviceId: 'USB001',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should fail for invalid connection settings', async () => {
    const tenant = await tenantsRepository.create({
      name: 'Tenant USB',
      slug: 'tenant-usb',
    });

    await expect(() =>
      sut.execute({
        tenantId: tenant.id.toString(),
        name: 'Caixa 02',
        type: 'THERMAL',
        connection: 'USB',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should fail when connection test fails', async () => {
    const tenant = await tenantsRepository.create({
      name: 'Tenant BT',
      slug: 'tenant-bt',
    });

    sut = new RegisterPrinterUseCase(
      tenantsRepository,
      printersRepository,
      new FailingConnectionValidator(),
    );

    await expect(() =>
      sut.execute({
        tenantId: tenant.id.toString(),
        name: 'Bluetooth',
        type: 'THERMAL',
        connection: 'BLUETOOTH',
        bluetoothAddress: 'AA:BB:CC:DD:EE:FF',
      }),
    ).rejects.toThrow(BadRequestError);
  });
});
