import { prisma } from '@/lib/prisma';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ExchangeRateResult {
  currency: string;
  rate: number;
  date: string;
  source: string;
}

interface ConversionResult {
  brlAmount: number;
  rate: number;
}

// ─── BCB API Response Types ──────────────────────────────────────────────────

interface BcbCotacaoResponse {
  value: Array<{
    cotacaoCompra: number;
    cotacaoVenda: number;
    dataHoraCotacao: string;
  }>;
}

// ─── Supported Currencies ────────────────────────────────────────────────────

const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'GBP'] as const;
type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

function isSupportedCurrency(currency: string): currency is SupportedCurrency {
  return SUPPORTED_CURRENCIES.includes(currency as SupportedCurrency);
}

// ─── BCB API Helpers ──────���──────────────────────────────────────────────────

function formatBcbDate(date: Date): string {
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  const yyyy = date.getUTCFullYear();
  return `${mm}-${dd}-${yyyy}`;
}

async function fetchDollarRate(date: Date): Promise<number | null> {
  const formattedDate = formatBcbDate(date);
  const url = `https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoDolarDia(dataCotacao=@dataCotacao)?@dataCotacao='${formattedDate}'&$format=json`;

  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) return null;
    const data = (await response.json()) as BcbCotacaoResponse;
    if (!data.value || data.value.length === 0) return null;
    return data.value[data.value.length - 1].cotacaoVenda;
  } catch {
    return null;
  }
}

async function fetchCurrencyRate(
  currency: string,
  date: Date,
): Promise<number | null> {
  if (currency === 'USD') {
    return fetchDollarRate(date);
  }

  const formattedDate = formatBcbDate(date);
  const url = `https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoMoedaDia(moeda=@moeda,dataCotacao=@dataCotacao)?@moeda='${currency}'&@dataCotacao='${formattedDate}'&$format=json`;

  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) return null;
    const data = (await response.json()) as BcbCotacaoResponse;
    if (!data.value || data.value.length === 0) return null;
    return data.value[data.value.length - 1].cotacaoVenda;
  } catch {
    return null;
  }
}

// ─── Service ─────────────────────────────────────────────────────────────────

export class ExchangeRateService {
  /**
   * Get exchange rate for a currency on a specific date.
   * First checks DB cache; if not found, fetches from BCB and caches it.
   */
  async getRate(currency: string, date: Date): Promise<number> {
    if (currency === 'BRL') return 1;

    if (!isSupportedCurrency(currency)) {
      throw new Error(`Moeda não suportada: ${currency}. Use: ${SUPPORTED_CURRENCIES.join(', ')}`);
    }

    const dateOnly = new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
    );

    // Check DB cache
    const cached = await prisma.exchangeRate.findUnique({
      where: {
        currency_date: { currency, date: dateOnly },
      },
    });

    if (cached) {
      return Number(cached.rate);
    }

    // Fetch from BCB — try date, then go back up to 5 business days
    let rate: number | null = null;
    let tryDate = new Date(dateOnly);

    for (let attempt = 0; attempt < 5; attempt++) {
      rate = await fetchCurrencyRate(currency, tryDate);
      if (rate !== null) break;
      tryDate = new Date(tryDate.getTime() - 24 * 60 * 60 * 1000);
    }

    if (rate === null) {
      throw new Error(
        `Não foi possível obter a cotação de ${currency} para ${dateOnly.toISOString().split('T')[0]}`,
      );
    }

    // Cache in DB
    await prisma.exchangeRate.upsert({
      where: {
        currency_date: { currency, date: dateOnly },
      },
      create: {
        currency,
        rate,
        date: dateOnly,
        source: 'BCB',
      },
      update: {
        rate,
        source: 'BCB',
      },
    });

    return rate;
  }

  /**
   * Get latest available rate (uses today or most recent business day).
   */
  async getLatestRate(currency: string): Promise<number> {
    return this.getRate(currency, new Date());
  }

  /**
   * Convert an amount from a foreign currency to BRL.
   */
  async convertToBRL(
    amount: number,
    currency: string,
    date?: Date,
  ): Promise<ConversionResult> {
    if (currency === 'BRL') {
      return { brlAmount: amount, rate: 1 };
    }

    const rate = await this.getRate(currency, date ?? new Date());
    const brlAmount = Math.round(amount * rate * 100) / 100;
    return { brlAmount, rate };
  }

  /**
   * List cached rates for a currency (most recent first).
   */
  async listRates(
    currency: string,
    limit = 30,
  ): Promise<ExchangeRateResult[]> {
    const rates = await prisma.exchangeRate.findMany({
      where: { currency },
      orderBy: { date: 'desc' },
      take: limit,
    });

    return rates.map((r) => ({
      currency: r.currency,
      rate: Number(r.rate),
      date: r.date.toISOString().split('T')[0],
      source: r.source,
    }));
  }
}

// ─── Singleton ───────────────────────────────────────────────────────────────

let _instance: ExchangeRateService | null = null;

export function makeExchangeRateService(): ExchangeRateService {
  if (!_instance) {
    _instance = new ExchangeRateService();
  }
  return _instance;
}
