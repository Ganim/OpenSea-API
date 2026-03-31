import https from 'node:https';
import type {
  AccountBalance,
  BankAccountData,
  BankTransaction,
  BankingProvider,
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
} from './banking-provider.interface';

// ─── Constants ────────────────────────────────────────────────────────────────

const SICOOB_AUTH_URL =
  'https://auth.sicoob.com.br/auth/realms/cooperado/protocol/openid-connect/token';

const SICOOB_API_BASE = 'https://api.sicoob.com.br';

/** Refresh the token this many seconds before it expires to avoid race conditions */
const TOKEN_REFRESH_BUFFER_SECONDS = 30;

// ─── Config ───────────────────────────────────────────────────────────────────

export interface SicoobProviderConfig {
  clientId: string;
  certFileId: string;
  keyFileId: string;
  scopes: string[];
  accountNumber: string;
  agency: string;
  certLoader: {
    loadCertBuffers(
      certFileId: string,
      keyFileId: string,
    ): Promise<{
      cert: Buffer;
      key: Buffer;
    }>;
  };
}

// ─── Provider ────────────────────────────────────────────────────────────────

/**
 * Sicoob Conta Corrente V4 banking provider.
 *
 * Docs: https://developers.sicoob.com.br
 *
 * Auth: OAuth2 client_credentials grant with mTLS (certificate + key via Storage)
 *
 * Endpoints used (Task 3):
 * - POST {auth_url}                                               — Authenticate
 * - GET  /conta-corrente/v4/contas/{accountId}/saldo              — Balance
 * - GET  /conta-corrente/v4/contas/{accountId}/extrato?...        — Transactions
 */
export class SicoobProvider implements BankingProvider {
  readonly providerName = 'SICOOB';
  readonly capabilities: ProviderCapability[] = [
    'READ',
    'BOLETO',
    'PIX',
    'PAYMENT',
    'TED',
  ];

  private cachedToken: string | null = null;
  private tokenExpiresAt = 0; // Unix ms

  constructor(private readonly config: SicoobProviderConfig) {}

  // ─── BankingProvider: authenticate ───────────────────────────────────────

  async authenticate(): Promise<void> {
    await this.getAccessToken();
  }

  // ─── BankingProvider: read operations ────────────────────────────────────

  async getAccounts(): Promise<BankAccountData[]> {
    return [
      {
        id: this.config.accountNumber,
        type: 'BANK',
        name: `Sicoob ${this.config.agency}/${this.config.accountNumber}`,
        number: this.config.accountNumber,
        balance: 0,
        currencyCode: 'BRL',
      },
    ];
  }

  async getBalance(accountId: string): Promise<AccountBalance> {
    const token = await this.getAccessToken();
    const agent = await this.buildAgent();

    const response = await fetch(
      `${SICOOB_API_BASE}/conta-corrente/v4/contas/${accountId}/saldo`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        // @ts-expect-error — Node.js fetch accepts agent for mTLS
        agent,
      },
    );

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(
        `Sicoob balance error (${response.status}): ${JSON.stringify(errorBody)}`,
      );
    }

    const data = (await response.json()) as {
      saldo: { disponivel: number; bloqueado: number };
    };

    const disponivel = data.saldo.disponivel;
    const bloqueado = data.saldo.bloqueado;

    return {
      available: disponivel,
      current: disponivel - bloqueado,
      currency: 'BRL',
      updatedAt: new Date().toISOString(),
    };
  }

  async getTransactions(
    accountId: string,
    from: string,
    to: string,
  ): Promise<BankTransaction[]> {
    const token = await this.getAccessToken();
    const agent = await this.buildAgent();

    const url = `${SICOOB_API_BASE}/conta-corrente/v4/contas/${accountId}/extrato?dataInicio=${from}&dataFim=${to}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      // @ts-expect-error — Node.js fetch accepts agent for mTLS
      agent,
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(
        `Sicoob transactions error (${response.status}): ${JSON.stringify(errorBody)}`,
      );
    }

    const data = (await response.json()) as {
      transacoes: Array<{
        id: string;
        data: string;
        descricao: string;
        valor: number;
        tipo: string;
      }>;
    };

    return data.transacoes.map((tx) => ({
      id: tx.id,
      date: tx.data,
      description: tx.descricao,
      amount: tx.valor,
      type: tx.valor >= 0 ? 'CREDIT' : ('DEBIT' as BankTransaction['type']),
    }));
  }

  // ─── BankingProvider: write stubs (Tasks 4–5) ────────────────────────────

  async createBoleto(_data: CreateBoletoInput): Promise<BoletoResult> {
    throw new Error('Not implemented yet');
  }

  async cancelBoleto(_nossoNumero: string): Promise<void> {
    throw new Error('Not implemented yet');
  }

  async getBoleto(_nossoNumero: string): Promise<BoletoResult> {
    throw new Error('Not implemented yet');
  }

  async createPixCharge(_data: CreatePixChargeInput): Promise<PixChargeResult> {
    throw new Error('Not implemented yet');
  }

  async executePixPayment(
    _data: ExecutePixPaymentInput,
  ): Promise<PaymentReceipt> {
    throw new Error('Not implemented yet');
  }

  async getPixCharge(_txId: string): Promise<PixChargeResult> {
    throw new Error('Not implemented yet');
  }

  async executePayment(_data: ExecutePaymentInput): Promise<PaymentReceipt> {
    throw new Error('Not implemented yet');
  }

  async getPaymentStatus(_paymentId: string): Promise<PaymentStatus> {
    throw new Error('Not implemented yet');
  }

  async registerWebhook(_url: string, _events: WebhookEvent[]): Promise<void> {
    throw new Error('Not implemented yet');
  }

  async handleWebhookPayload(_payload: unknown): Promise<WebhookResult> {
    throw new Error('Not implemented yet');
  }

  // ─── Internal helpers ─────────────────────────────────────────────────────

  private async getAccessToken(): Promise<string> {
    const nowMs = Date.now();

    if (
      this.cachedToken !== null &&
      nowMs < this.tokenExpiresAt - TOKEN_REFRESH_BUFFER_SECONDS * 1000
    ) {
      return this.cachedToken;
    }

    const agent = await this.buildAgent();
    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: this.config.clientId,
      scope: this.config.scopes.join(' '),
    });

    const response = await fetch(SICOOB_AUTH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
      // @ts-expect-error — Node.js fetch accepts agent for mTLS
      agent,
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(
        `Sicoob auth failed (${response.status}): ${JSON.stringify(errorBody)}`,
      );
    }

    const data = (await response.json()) as {
      access_token: string;
      expires_in: number;
    };

    this.cachedToken = data.access_token;
    this.tokenExpiresAt = nowMs + data.expires_in * 1000;

    return this.cachedToken;
  }

  private async buildAgent(): Promise<https.Agent> {
    const { cert, key } = await this.config.certLoader.loadCertBuffers(
      this.config.certFileId,
      this.config.keyFileId,
    );

    return new https.Agent({ cert, key });
  }
}
