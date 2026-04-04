import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { TenantPaymentConfig } from '@/entities/sales/tenant-payment-config';
import { InMemoryPaymentConfigsRepository } from '@/repositories/sales/in-memory/in-memory-payment-configs-repository';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TestPaymentConnectionUseCase } from './test-payment-connection';

// Mock FieldCipherService
vi.mock('@/services/security/field-cipher-service', () => ({
  getFieldCipherService: () => ({
    encrypt: (value: string) => `encrypted:${value}`,
    decrypt: (value: string) => value.replace('encrypted:', ''),
  }),
}));

// Mock createPaymentProvider to avoid real HTTP calls
vi.mock('@/services/payment/provider-registry', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    createPaymentProvider: vi.fn().mockReturnValue({
      name: 'infinitepay',
      testConnection: vi.fn().mockResolvedValue({
        ok: true,
        message: 'Connected successfully.',
      }),
    }),
  };
});

let paymentConfigsRepository: InMemoryPaymentConfigsRepository;
let testPaymentConnection: TestPaymentConnectionUseCase;

describe('TestPaymentConnectionUseCase', () => {
  beforeEach(() => {
    paymentConfigsRepository = new InMemoryPaymentConfigsRepository();
    testPaymentConnection = new TestPaymentConnectionUseCase(
      paymentConfigsRepository,
    );
  });

  it('should throw when no config exists', async () => {
    await expect(() =>
      testPaymentConnection.execute({
        tenantId: 'tenant-1',
        slot: 'primary',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should test manual provider successfully', async () => {
    const config = TenantPaymentConfig.create({
      tenantId: new UniqueEntityID('tenant-1'),
      primaryProvider: 'manual',
      primaryConfig: 'encrypted:{}',
      primaryActive: true,
    });

    paymentConfigsRepository.items.push(config);

    const result = await testPaymentConnection.execute({
      tenantId: 'tenant-1',
      slot: 'primary',
    });

    expect(result.ok).toBe(true);
    expect(config.primaryTestedAt).toBeDefined();
  });

  it('should test gateway provider and update testedAt on success', async () => {
    const config = TenantPaymentConfig.create({
      tenantId: new UniqueEntityID('tenant-1'),
      primaryProvider: 'infinitepay',
      primaryConfig:
        'encrypted:' +
        JSON.stringify({ clientId: 'id', clientSecret: 'secret' }),
      primaryActive: true,
    });

    paymentConfigsRepository.items.push(config);

    const result = await testPaymentConnection.execute({
      tenantId: 'tenant-1',
      slot: 'primary',
    });

    expect(result.ok).toBe(true);
    expect(config.primaryTestedAt).toBeDefined();
  });

  it('should throw when fallback provider is not configured', async () => {
    const config = TenantPaymentConfig.create({
      tenantId: new UniqueEntityID('tenant-1'),
      primaryProvider: 'manual',
      primaryConfig: 'encrypted:{}',
      primaryActive: true,
    });

    paymentConfigsRepository.items.push(config);

    await expect(() =>
      testPaymentConnection.execute({
        tenantId: 'tenant-1',
        slot: 'fallback',
      }),
    ).rejects.toThrow(BadRequestError);
  });
});
