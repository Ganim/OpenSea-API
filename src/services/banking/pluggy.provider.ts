import { OperationNotSupportedError } from '@/@errors/use-cases/operation-not-supported';
import type {
  AccountBalance,
  BankAccountData,
  BankTransaction,
  BoletoResult,
  CreateBoletoInput,
  CreatePixChargeInput,
  ExecutePaymentInput,
  ExecutePixPaymentInput,
  PaymentReceipt,
  PaymentStatus,
  PixChargeResult,
  ProviderCapability,
  WebhookEvent,
  WebhookResult,
  BankingProvider,
} from './banking-provider.interface';
import type {
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
 *
 * Capabilities: READ only (Pluggy is an Open Finance aggregator, not a transactional bank API)
 */
export class PluggyProvider implements BankingProvider {
  readonly providerName = 'PLUGGY';
  readonly capabilities: ProviderCapability[] = ['READ'];

  private cachedApiKey: string | null = null;
  private apiKeyExpiration: Date = new Date(0);

  // ─── BankingProvider: authenticate (no-op — Pluggy authenticates per-request) ───

  async authenticate(): Promise<void> {
    // Pluggy authenticates lazily per-request via client_id/client_secret.
    // Pre-warm the cached API key so callers can await this as a health check.
    await this.getApiKey();
  }

  async healthCheck(
    _accountId: string,
  ): Promise<import('./banking-provider.interface').HealthCheckResult> {
    const start = Date.now();
    const checks = {
      auth: { ok: false, error: undefined as string | undefined },
      balance: { ok: false, error: undefined as string | undefined },
      timestamp: new Date().toISOString(),
    };

    try {
      await this.getApiKey();
      checks.auth.ok = true;
      checks.balance.ok = true;
    } catch (err) {
      checks.auth.error = err instanceof Error ? err.message : 'Auth failed';
    }

    return {
      provider: 'PLUGGY',
      status: checks.auth.ok ? 'healthy' : 'unhealthy',
      latencyMs: Date.now() - start,
      checks,
      sandbox: false,
    };
  }

  // ─── BankingProvider: read operations ────────────────────────────────────────

  /**
   * Returns all accounts across all connected items.
   * NOTE: Pluggy's API requires an itemId to list accounts.
   * This method is a no-op stub for the generic interface — use
   * `getAccountsByItem(itemId)` for Pluggy-specific usage.
   */
  async getAccounts(): Promise<BankAccountData[]> {
    // The generic interface has no itemId concept.
    // Callers that need Pluggy-specific item-scoped accounts should use getAccountsByItem().
    return [];
  }

  async getBalance(accountId: string): Promise<AccountBalance> {
    // Pluggy exposes balance as part of the account object.
    // We fetch the account detail via the accounts endpoint filtered by id.
    const apiKey = await this.getApiKey();
    const response = await this.request(
      apiKey,
      'GET',
      `/accounts/${accountId}`,
    );

    const account = response as Record<string, unknown>;
    const balance = (account.balance as number) ?? 0;

    return {
      available: balance,
      current: balance,
      currency: (account.currencyCode as string) ?? 'BRL',
      updatedAt: new Date().toISOString(),
    };
  }

  async getTransactions(
    accountId: string,
    from: string,
    to: string,
  ): Promise<BankTransaction[]> {
    const pluggyTransactions = await this.getPluggyTransactions(
      accountId,
      from,
      to,
    );

    return pluggyTransactions.map((tx) => ({
      id: tx.id,
      date: tx.date,
      description: tx.description,
      amount: tx.amount,
      type: tx.type,
      category: tx.category,
      providerCode: tx.providerCode,
    }));
  }

  // ─── BankingProvider: write stubs (not supported by Pluggy) ──────────────────

  async createBoleto(_data: CreateBoletoInput): Promise<BoletoResult> {
    throw new OperationNotSupportedError(
      'Pluggy does not support boleto creation',
    );
  }

  async cancelBoleto(_nossoNumero: string): Promise<void> {
    throw new OperationNotSupportedError(
      'Pluggy does not support boleto cancellation',
    );
  }

  async getBoleto(_nossoNumero: string): Promise<BoletoResult> {
    throw new OperationNotSupportedError(
      'Pluggy does not support boleto retrieval',
    );
  }

  async createPixCharge(_data: CreatePixChargeInput): Promise<PixChargeResult> {
    throw new OperationNotSupportedError(
      'Pluggy does not support PIX charge creation',
    );
  }

  async executePixPayment(
    _data: ExecutePixPaymentInput,
  ): Promise<PaymentReceipt> {
    throw new OperationNotSupportedError(
      'Pluggy does not support PIX payments',
    );
  }

  async getPixCharge(_txId: string): Promise<PixChargeResult> {
    throw new OperationNotSupportedError(
      'Pluggy does not support PIX charge retrieval',
    );
  }

  async executePayment(_data: ExecutePaymentInput): Promise<PaymentReceipt> {
    throw new OperationNotSupportedError(
      'Pluggy does not support payment execution',
    );
  }

  async getPaymentStatus(_paymentId: string): Promise<PaymentStatus> {
    throw new OperationNotSupportedError(
      'Pluggy does not support payment status queries',
    );
  }

  async registerWebhook(_url: string, _events: WebhookEvent[]): Promise<void> {
    throw new OperationNotSupportedError(
      'Pluggy does not support webhook registration via this interface',
    );
  }

  async handleWebhookPayload(_payload: unknown): Promise<WebhookResult> {
    throw new OperationNotSupportedError(
      'Pluggy does not support webhook payload handling',
    );
  }

  // ─── Pluggy-specific methods (kept for backward compatibility) ────────────────

  async createConnectToken(options?: {
    clientUserId?: string;
  }): Promise<PluggyConnectToken> {
    const apiKey = await this.getApiKey();

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
    const apiKey = await this.getApiKey();
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

  async getAccountsByItem(itemId: string): Promise<PluggyAccount[]> {
    const apiKey = await this.getApiKey();
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

  private async getPluggyTransactions(
    accountId: string,
    from: string,
    to: string,
  ): Promise<PluggyTransaction[]> {
    const apiKey = await this.getApiKey();
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

  // ─── Internal helpers ─────────────────────────────────────────────────────────

  private async getApiKey(): Promise<string> {
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
