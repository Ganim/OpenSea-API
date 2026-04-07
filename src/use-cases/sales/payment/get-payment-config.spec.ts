import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { TenantPaymentConfig } from '@/entities/sales/tenant-payment-config';
import { InMemoryPaymentConfigsRepository } from '@/repositories/sales/in-memory/in-memory-payment-configs-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetPaymentConfigUseCase } from './get-payment-config';

let paymentConfigsRepository: InMemoryPaymentConfigsRepository;
let getPaymentConfig: GetPaymentConfigUseCase;

describe('GetPaymentConfigUseCase', () => {
  beforeEach(() => {
    paymentConfigsRepository = new InMemoryPaymentConfigsRepository();
    getPaymentConfig = new GetPaymentConfigUseCase(paymentConfigsRepository);
  });

  it('should return null when no config exists', async () => {
    const result = await getPaymentConfig.execute({
      tenantId: 'tenant-1',
    });

    expect(result.paymentConfig).toBeNull();
  });

  it('should return the payment config when it exists', async () => {
    const config = TenantPaymentConfig.create({
      tenantId: new UniqueEntityID('tenant-1'),
      primaryProvider: 'infinitepay',
      primaryConfig: 'encrypted-config',
      primaryActive: true,
    });

    paymentConfigsRepository.items.push(config);

    const result = await getPaymentConfig.execute({
      tenantId: 'tenant-1',
    });

    expect(result.paymentConfig).toBeDefined();
    expect(result.paymentConfig!.primaryProvider).toBe('infinitepay');
    expect(result.paymentConfig!.primaryActive).toBe(true);
  });
});
