import { PixCharge } from '@/entities/cashier/pix-charge';
import { InMemoryPixChargesRepository } from '@/repositories/cashier/in-memory/in-memory-pix-charges-repository';
import type { PixProvider } from '@/services/cashier/pix-provider.interface';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ReceivePixWebhookUseCase } from './receive-pix-webhook';

let pixChargesRepository: InMemoryPixChargesRepository;
let mockPixProvider: PixProvider;
let sut: ReceivePixWebhookUseCase;

describe('ReceivePixWebhookUseCase', () => {
  beforeEach(() => {
    pixChargesRepository = new InMemoryPixChargesRepository();

    mockPixProvider = {
      providerName: 'MOCK',
      createCharge: vi.fn(),
      cancelCharge: vi.fn(),
      queryCharge: vi.fn(),
      parseWebhook: vi.fn().mockResolvedValue({
        txId: 'tx-webhook-001',
        endToEndId: 'E2E-12345',
        payerName: 'Joao Silva',
        payerCpfCnpj: '12345678900',
        amount: 150.0,
        paidAt: new Date('2026-03-25T10:00:00Z'),
      }),
      verifyWebhook: vi.fn().mockReturnValue(true),
    };

    sut = new ReceivePixWebhookUseCase(pixChargesRepository, mockPixProvider);
  });

  it('should mark charge as paid when webhook is valid', async () => {
    const activeCharge = PixCharge.create({
      tenantId: 'tenant-1',
      txId: 'tx-webhook-001',
      location: 'https://pix.example.com/qr/tx-webhook-001',
      pixCopiaECola: '00020126580014br.gov.bcb.pix',
      amount: 150.0,
      expiresAt: new Date('2026-03-26T00:00:00Z'),
      provider: 'MOCK',
    });
    await pixChargesRepository.create(activeCharge);

    const { pixCharge } = await sut.execute({
      rawPayload: { pix: [] },
      signature: 'valid-sig',
    });

    expect(pixCharge.status).toBe('COMPLETED');
    expect(pixCharge.payerName).toBe('Joao Silva');
    expect(pixCharge.payerCpfCnpj).toBe('12345678900');
    expect(pixCharge.endToEndId).toBe('E2E-12345');
    expect(pixCharge.paidAt).toBeTruthy();
  });

  it('should reject invalid webhook signature', async () => {
    vi.mocked(mockPixProvider.verifyWebhook).mockReturnValue(false);

    await expect(
      sut.execute({
        rawPayload: { pix: [] },
        signature: 'invalid-sig',
      }),
    ).rejects.toThrow('Invalid webhook signature');
  });

  it('should reject webhook for non-existent charge', async () => {
    await expect(
      sut.execute({
        rawPayload: { pix: [] },
        signature: 'valid-sig',
      }),
    ).rejects.toThrow('PIX charge not found');
  });

  it('should reject webhook for non-active charge', async () => {
    const completedCharge = PixCharge.create({
      tenantId: 'tenant-1',
      txId: 'tx-webhook-001',
      location: 'https://pix.example.com/qr/tx-webhook-001',
      pixCopiaECola: '00020126580014br.gov.bcb.pix',
      amount: 150.0,
      status: 'COMPLETED',
      expiresAt: new Date('2026-03-26T00:00:00Z'),
      provider: 'MOCK',
    });
    await pixChargesRepository.create(completedCharge);

    await expect(
      sut.execute({
        rawPayload: { pix: [] },
        signature: 'valid-sig',
      }),
    ).rejects.toThrow('PIX charge is not active');
  });
});
