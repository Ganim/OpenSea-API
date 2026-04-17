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
            cotacaoCompra: 5.4,
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
          value: [
            {
              cotacaoCompra: 5.3,
              cotacaoVenda: 5.35,
              dataHoraCotacao: '2026-03-21',
            },
          ],
        }),
      };
    });

    const rate = await sut.getRate('USD', new Date('2026-03-25'));

    expect(rate).toBe(5.35);
    expect(callCount).toBe(4);
  });

  // ─── P2-56: BCB unavailable — network failures, HTTP errors, timeouts ─
  // The service already swallows fetch errors inside `fetchDollarRate` and
  // `fetchCurrencyRate` (returning null), then retries up to 5 attempts.
  // After all retries fail it throws a user-facing error. These tests
  // regress each failure path so we don't silently regress to a stale
  // placeholder or leak network errors to the cron.
  it('should throw user-facing error when BCB is unreachable for all 5 retries (network down)', async () => {
    mockPrisma.exchangeRate.findUnique.mockResolvedValue(null);

    // Every attempt rejects with a network error (DNS failure, TCP reset, etc.)
    mockFetch.mockRejectedValue(new Error('ECONNREFUSED'));

    await expect(sut.getRate('USD', new Date('2026-03-25'))).rejects.toThrow(
      /Não foi possível obter a cotação de USD/,
    );

    // Exactly 5 attempts (one per business day fallback)
    expect(mockFetch).toHaveBeenCalledTimes(5);
    // Must NOT cache a bogus rate
    expect(mockPrisma.exchangeRate.upsert).not.toHaveBeenCalled();
  });

  it('should throw user-facing error when BCB responds with HTTP 5xx consistently', async () => {
    mockPrisma.exchangeRate.findUnique.mockResolvedValue(null);

    // Every attempt returns HTTP 503 Service Unavailable
    mockFetch.mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({ error: 'Service Unavailable' }),
    });

    await expect(sut.getRate('EUR', new Date('2026-03-25'))).rejects.toThrow(
      /Não foi possível obter a cotação de EUR/,
    );

    expect(mockFetch).toHaveBeenCalledTimes(5);
    expect(mockPrisma.exchangeRate.upsert).not.toHaveBeenCalled();
  });

  it('should throw user-facing error when BCB times out (AbortError) every retry', async () => {
    mockPrisma.exchangeRate.findUnique.mockResolvedValue(null);

    // AbortSignal.timeout fires a DOMException-like AbortError on timeout
    mockFetch.mockRejectedValue(
      Object.assign(new Error('The operation was aborted'), {
        name: 'AbortError',
      }),
    );

    await expect(sut.getRate('GBP', new Date('2026-03-25'))).rejects.toThrow(
      /Não foi possível obter a cotação de GBP/,
    );

    expect(mockFetch).toHaveBeenCalledTimes(5);
  });

  it('should recover when BCB fails the first 2 retries then returns data (transient failure)', async () => {
    mockPrisma.exchangeRate.findUnique.mockResolvedValue(null);
    mockPrisma.exchangeRate.upsert.mockResolvedValue({});

    let callCount = 0;
    mockFetch.mockImplementation(async () => {
      callCount++;
      if (callCount === 1) {
        throw new Error('ENOTFOUND olinda.bcb.gov.br');
      }
      if (callCount === 2) {
        return { ok: false, status: 502, json: async () => ({}) };
      }
      // 3rd retry succeeds
      return {
        ok: true,
        json: async () => ({
          value: [
            {
              cotacaoCompra: 5.45,
              cotacaoVenda: 5.5,
              dataHoraCotacao: '2026-03-23',
            },
          ],
        }),
      };
    });

    const rate = await sut.getRate('USD', new Date('2026-03-25'));

    expect(rate).toBe(5.5);
    expect(callCount).toBe(3);
    // Must cache the eventually-successful rate under the originally-requested
    // date (not the fallback date) so subsequent calls hit the cache.
    expect(mockPrisma.exchangeRate.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ currency: 'USD', rate: 5.5 }),
      }),
    );
  });

  it('should not throw on convertToBRL for BRL even if BCB is down', async () => {
    // Simulate BCB unreachable — should never be called for BRL
    mockFetch.mockRejectedValue(new Error('BCB unreachable'));

    const result = await sut.convertToBRL(777.77, 'BRL', new Date());

    expect(result.rate).toBe(1);
    expect(result.brlAmount).toBe(777.77);
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
