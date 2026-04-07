import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { InMemoryPaymentConfigsRepository } from '@/repositories/sales/in-memory/in-memory-payment-configs-repository';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SavePaymentConfigUseCase } from './save-payment-config';

// Mock FieldCipherService
vi.mock('@/services/security/field-cipher-service', () => ({
  getFieldCipherService: () => ({
    encrypt: (value: string) => `encrypted:${value}`,
    decrypt: (value: string) => value.replace('encrypted:', ''),
  }),
}));

let paymentConfigsRepository: InMemoryPaymentConfigsRepository;
let savePaymentConfig: SavePaymentConfigUseCase;

describe('SavePaymentConfigUseCase', () => {
  beforeEach(() => {
    paymentConfigsRepository = new InMemoryPaymentConfigsRepository();
    savePaymentConfig = new SavePaymentConfigUseCase(paymentConfigsRepository);
  });

  it('should save a payment config with primary provider', async () => {
    const result = await savePaymentConfig.execute({
      tenantId: 'tenant-1',
      primaryProvider: 'manual',
      primaryConfig: {},
      primaryActive: true,
    });

    expect(result.paymentConfig).toBeDefined();
    expect(result.paymentConfig.primaryProvider).toBe('manual');
    expect(result.paymentConfig.primaryActive).toBe(true);
    expect(paymentConfigsRepository.items).toHaveLength(1);
  });

  it('should save a payment config with primary and fallback providers', async () => {
    const result = await savePaymentConfig.execute({
      tenantId: 'tenant-1',
      primaryProvider: 'infinitepay',
      primaryConfig: { clientId: 'id-123', clientSecret: 'secret-456' },
      primaryActive: true,
      fallbackProvider: 'asaas',
      fallbackConfig: { apiKey: 'key-789', environment: 'sandbox' },
      fallbackActive: true,
    });

    expect(result.paymentConfig.primaryProvider).toBe('infinitepay');
    expect(result.paymentConfig.fallbackProvider).toBe('asaas');
    expect(result.paymentConfig.fallbackActive).toBe(true);
  });

  it('should reject invalid primary provider', async () => {
    await expect(() =>
      savePaymentConfig.execute({
        tenantId: 'tenant-1',
        primaryProvider: 'invalid-provider',
        primaryConfig: {},
        primaryActive: true,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should reject invalid fallback provider', async () => {
    await expect(() =>
      savePaymentConfig.execute({
        tenantId: 'tenant-1',
        primaryProvider: 'manual',
        primaryConfig: {},
        primaryActive: true,
        fallbackProvider: 'nonexistent',
        fallbackConfig: {},
        fallbackActive: true,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should reject same provider for primary and fallback', async () => {
    await expect(() =>
      savePaymentConfig.execute({
        tenantId: 'tenant-1',
        primaryProvider: 'infinitepay',
        primaryConfig: { clientId: 'id', clientSecret: 'secret' },
        primaryActive: true,
        fallbackProvider: 'infinitepay',
        fallbackConfig: { clientId: 'id2', clientSecret: 'secret2' },
        fallbackActive: true,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should update existing config when saving again', async () => {
    await savePaymentConfig.execute({
      tenantId: 'tenant-1',
      primaryProvider: 'manual',
      primaryConfig: {},
      primaryActive: false,
    });

    await savePaymentConfig.execute({
      tenantId: 'tenant-1',
      primaryProvider: 'infinitepay',
      primaryConfig: { clientId: 'id', clientSecret: 'secret' },
      primaryActive: true,
    });

    expect(paymentConfigsRepository.items).toHaveLength(1);
    expect(paymentConfigsRepository.items[0].primaryProvider).toBe(
      'infinitepay',
    );
  });
});
