import { beforeEach, describe, expect, it, vi } from 'vitest';

// ─── Mock fetch ──────────────────────────────────────────────────────────────

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// ─── Mock Prisma ─────────────────────────────────────────────────────────────

vi.mock('@/lib/prisma', () => ({
  prisma: {
    exchangeRate: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';
import { ExchangeRateService } from './exchange-rate.service';

const mockPrisma = prisma as unknown as {
  exchangeRate: {
    findUnique: ReturnType<typeof vi.fn>;
    upsert: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
  };
};

let sut: ExchangeRateService;

describe('ExchangeRateService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sut = new ExchangeRateService();
  });

  it('should return cached rate from DB when available', async () => {
    mockPrisma.exchangeRate.findUnique.mockResolvedValue({
      currency: 'USD',
      rate: 5.42,
      date: new Date('2026-03-25'),
      source: 'BCB',
    });

    const rate = await sut.getRate('USD', new Date('2026-03-25'));

    expect(rate).toBe(5.42);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should fetch from BCB when not cached and store result', async () => {
    mockPrisma.exchangeRate.findUnique.mockResolvedValue(null);
    mockPrisma.exchangeRate.upsert.mockResolvedValue({});

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        value: [
          {
            cotacaoCompra: 5.40,
            cotacaoVenda: 5.42,
            dataHoraCotacao: '2026-03-25 13:00:00.000',
          },
        ],
      }),
    });

    const rate = await sut.getRate('USD', new Date('2026-03-25'));

    expect(rate).toBe(5.42);
    expect(mockPrisma.exchangeRate.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          currency: 'USD',
          rate: 5.42,
          source: 'BCB',
        }),
      }),
    );
  });

  it('should convert amount to BRL correctly', async () => {
    mockPrisma.exchangeRate.findUnique.mockResolvedValue({
      currency: 'USD',
      rate: 5.5,
      date: new Date('2026-03-25'),
      source: 'BCB',
    });

    const result = await sut.convertToBRL(500, 'USD', new Date('2026-03-25'));

    expect(result.rate).toBe(5.5);
    expect(result.brlAmount).toBe(2750);
  });

  it('should return 1 for BRL currency', async () => {
    const rate = await sut.getRate('BRL', new Date());
    expect(rate).toBe(1);
  });

  it('should return identity conversion for BRL', async () => {
    const result = await sut.convertToBRL(1000, 'BRL');
    expect(result.rate).toBe(1);
    expect(result.brlAmount).toBe(1000);
  });

  it('should throw for unsupported currencies', async () => {
    await expect(sut.getRate('JPY', new Date())).rejects.toThrow(
      'Moeda não suportada',
    );
  });

  it('should retry up to 5 business days when BCB returns no data', async () => {
    mockPrisma.exchangeRate.findUnique.mockResolvedValue(null);
    mockPrisma.exchangeRate.upsert.mockResolvedValue({});

    // First 3 calls return empty, 4th returns data
    let callCount = 0;
    mockFetch.mockImplementation(async () => {
      callCount++;
      if (callCount < 4) {
        return { ok: true, json: async () => ({ value: [] }) };
      }
      return {
        ok: true,
        json: async () => ({
          value: [{ cotacaoCompra: 5.3, cotacaoVenda: 5.35, dataHoraCotacao: '2026-03-21' }],
        }),
      };
    });

    const rate = await sut.getRate('USD', new Date('2026-03-25'));

    expect(rate).toBe(5.35);
    expect(callCount).toBe(4);
  });
});
