import type {
  BankingProvider,
  PluggyAccount,
  PluggyConnectToken,
  PluggyItem,
  PluggyTransaction,
} from './pluggy-provider.interface';

const PLUGGY_API_URL = 'https://api.pluggy.ai';
const PLUGGY_CLIENT_ID = process.env.PLUGGY_CLIENT_ID || '';
const PLUGGY_CLIENT_SECRET = process.env.PLUGGY_CLIENT_SECRET || '';

/**
 * Pluggy Open Finance provider.
 *
 * Docs: https://docs.pluggy.ai
 *
 * Auth: API Key authentication via client_id/client_secret → bearer token
 *
 * Endpoints:
 * - POST /auth            — Authenticate and get API key
 * - POST /connect_token   — Create widget token (for frontend embed)
 * - GET  /items/{id}      — Get connection status
 * - GET  /accounts?itemId={id} — List accounts
 * - GET  /transactions?accountId={id}&from={date}&to={date} — List transactions
 */
export class PluggyProvider implements BankingProvider {
  readonly providerName = 'PLUGGY';

  private cachedApiKey: string | null = null;
  private apiKeyExpiration: Date = new Date(0);

  async createConnectToken(
    options?: { clientUserId?: string },
  ): Promise<PluggyConnectToken> {
    const apiKey = await this.authenticate();

    const body: Record<string, unknown> = {};
    if (options?.clientUserId) {
      body.clientUserId = options.clientUserId;
    }

    const response = await this.request(apiKey, 'POST', '/connect_token', body);

    return {
      accessToken: response.accessToken as string,
    };
  }

  async getItem(itemId: string): Promise<PluggyItem> {
    const apiKey = await this.authenticate();
    const response = await this.request(apiKey, 'GET', `/items/${itemId}`);

    return {
      id: response.id as string,
      status: response.status as PluggyItem['status'],
      executionStatus: response.executionStatus as string,
      connector: response.connector as PluggyItem['connector'],
      createdAt: response.createdAt as string,
      updatedAt: response.updatedAt as string,
    };
  }

  async getAccounts(itemId: string): Promise<PluggyAccount[]> {
    const apiKey = await this.authenticate();
    const response = await this.request(
      apiKey,
      'GET',
      `/accounts?itemId=${itemId}`,
    );

    const results = response.results as Record<string, unknown>[];
    return results.map((account) => ({
      id: account.id as string,
      itemId: account.itemId as string,
      type: account.type as PluggyAccount['type'],
      subtype: account.subtype as string,
      name: account.name as string,
      number: account.number as string,
      balance: account.balance as number,
      currencyCode: account.currencyCode as string,
      bankData: account.bankData as PluggyAccount['bankData'],
    }));
  }

  async getTransactions(
    accountId: string,
    from: string,
    to: string,
  ): Promise<PluggyTransaction[]> {
    const apiKey = await this.authenticate();
    const allTransactions: PluggyTransaction[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await this.request(
        apiKey,
        'GET',
        `/transactions?accountId=${accountId}&from=${from}&to=${to}&page=${page}&pageSize=100`,
      );

      const results = response.results as Record<string, unknown>[];
      const totalPages = response.totalPages as number;

      for (const tx of results) {
        allTransactions.push({
          id: tx.id as string,
          accountId: tx.accountId as string,
          date: tx.date as string,
          description: tx.description as string,
          amount: tx.amount as number,
          type: tx.type as PluggyTransaction['type'],
          category: tx.category as string | undefined,
          providerCode: tx.providerCode as string | undefined,
        });
      }

      hasMore = page < totalPages;
      page++;
    }

    return allTransactions;
  }

  private async authenticate(): Promise<string> {
    if (this.cachedApiKey && this.apiKeyExpiration > new Date()) {
      return this.cachedApiKey;
    }

    const response = await fetch(`${PLUGGY_API_URL}/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId: PLUGGY_CLIENT_ID,
        clientSecret: PLUGGY_CLIENT_SECRET,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(
        `Pluggy auth failed (${response.status}): ${JSON.stringify(errorBody)}`,
      );
    }

    const data = (await response.json()) as Record<string, unknown>;
    this.cachedApiKey = data.apiKey as string;
    // Pluggy API keys last 2 hours, we refresh at 1.5h
    this.apiKeyExpiration = new Date(Date.now() + 90 * 60 * 1000);

    return this.cachedApiKey;
  }

  private async request(
    apiKey: string,
    method: string,
    path: string,
    body?: unknown,
  ): Promise<Record<string, unknown>> {
    const options: RequestInit = {
      method,
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
    };

    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${PLUGGY_API_URL}${path}`, options);

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(
        `Pluggy API error (${response.status}): ${JSON.stringify(errorBody)}`,
      );
    }

    return response.json() as Promise<Record<string, unknown>>;
  }
}
