import { InMemoryPixChargesRepository } from '@/repositories/cashier/in-memory/in-memory-pix-charges-repository';
import { InMemoryTenantConsumptionsRepository } from '@/repositories/core/in-memory/in-memory-tenant-consumptions-repository';
import { TenantConsumption } from '@/entities/core/tenant-consumption';
import { API_METRICS } from '@/constants/api-metrics';
import type { PixProvider } from '@/services/cashier/pix-provider.interface';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CreatePixChargeUseCase } from './create-pix-charge';

let pixChargesRepository: InMemoryPixChargesRepository;
let consumptionsRepository: InMemoryTenantConsumptionsRepository;
let mockPixProvider: PixProvider;
let sut: CreatePixChargeUseCase;

describe('CreatePixChargeUseCase', () => {
  beforeEach(() => {
    pixChargesRepository = new InMemoryPixChargesRepository();
    consumptionsRepository = new InMemoryTenantConsumptionsRepository();

    mockPixProvider = {
      providerName: 'MOCK',
      createCharge: vi.fn().mockResolvedValue({
        txId: 'mock-tx-id-12345',
        location: 'https://pix.example.com/qr/mock-tx-id-12345',
        pixCopiaECola: '00020126580014br.gov.bcb.pix0136mock-tx-id-12345',
        expiresAt: new Date('2026-03-25T12:00:00Z'),
      }),
      cancelCharge: vi.fn(),
      queryCharge: vi.fn(),
      parseWebhook: vi.fn(),
      verifyWebhook: vi.fn(),
    };

    // Pre-populate the consumption record so incrementUsage works
    consumptionsRepository.items.push(
      TenantConsumption.create({
        tenantId: 'tenant-1',
        period: new Date().toISOString().slice(0, 7),
        metric: API_METRICS.PIX_TRANSACTIONS,
        used: 0,
        included: 100,
      }),
    );

    sut = new CreatePixChargeUseCase(
      pixChargesRepository,
      consumptionsRepository,
      mockPixProvider,
    );
  });

  it('should create a PIX charge and persist it', async () => {
    const { pixCharge } = await sut.execute({
      tenantId: 'tenant-1',
      amount: 150.5,
      description: 'Pedido #123',
    });

    expect(pixCharge.tenantId).toBe('tenant-1');
    expect(pixCharge.amount).toBe(150.5);
    expect(pixCharge.status).toBe('ACTIVE');
    expect(pixCharge.provider).toBe('MOCK');
    expect(pixCharge.location).toBe(
      'https://pix.example.com/qr/mock-tx-id-12345',
    );
    expect(pixChargesRepository.items).toHaveLength(1);
  });

  it('should call the PIX provider with correct params', async () => {
    await sut.execute({
      tenantId: 'tenant-1',
      amount: 99.99,
      description: 'Test charge',
    });

    expect(mockPixProvider.createCharge).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 99.99,
        description: 'Test charge',
      }),
    );
  });

  it('should track PIX consumption', async () => {
    await sut.execute({
      tenantId: 'tenant-1',
      amount: 50.0,
    });

    const consumption = consumptionsRepository.items.find(
      (c) => c.metric === API_METRICS.PIX_TRANSACTIONS,
    );
    expect(consumption?.used).toBe(1);
  });

  it('should associate charge with orderId when provided', async () => {
    const { pixCharge } = await sut.execute({
      tenantId: 'tenant-1',
      amount: 200.0,
      orderId: 'order-456',
    });

    expect(pixCharge.orderId).toBe('order-456');
  });

  it('should associate charge with posTransactionPaymentId when provided', async () => {
    const { pixCharge } = await sut.execute({
      tenantId: 'tenant-1',
      amount: 75.0,
      posTransactionPaymentId: 'pos-payment-789',
    });

    expect(pixCharge.posTransactionPaymentId).toBe('pos-payment-789');
  });
});
