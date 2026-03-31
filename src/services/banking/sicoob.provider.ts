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

  // ─── BankingProvider: boleto (Cobrança Bancária V3) ─────────────────────

  async createBoleto(data: CreateBoletoInput): Promise<BoletoResult> {
    const body = {
      numeroCliente: this.config.accountNumber,
      especieDocumento: 'DM',
      dataVencimento: data.dueDate,
      valor: data.amount,
      pagador: {
        numeroCpfCnpj: data.customerCpfCnpj,
        nome: data.customerName,
      },
      mensagensInstrucao: { mensagem1: data.description },
      gerarPdf: true,
      hibrido: data.isHybrid ?? true,
    };
    const result = await this.request(
      'POST',
      '/cobranca-bancaria/v3/boletos',
      body,
    );
    return {
      nossoNumero: String(result.nossoNumero ?? ''),
      barcode: String(result.codigoBarras ?? ''),
      digitableLine: String(result.linhaDigitavel ?? ''),
      pixCopyPaste: result.pixCopiaECola as string | undefined,
      pdfUrl: result.pdfUrl as string | undefined,
      status: 'REGISTERED',
      dueDate: data.dueDate,
      amount: data.amount,
    };
  }

  async cancelBoleto(nossoNumero: string): Promise<void> {
    await this.request(
      'PATCH',
      `/cobranca-bancaria/v3/boletos/${nossoNumero}/baixar`,
      {
        motivo: 'SOLICITACAO_CEDENTE',
      },
    );
  }

  async getBoleto(nossoNumero: string): Promise<BoletoResult> {
    const result = await this.request(
      'GET',
      `/cobranca-bancaria/v3/boletos/${nossoNumero}`,
    );
    return {
      nossoNumero: String(result.nossoNumero ?? ''),
      barcode: String(result.codigoBarras ?? ''),
      digitableLine: String(result.linhaDigitavel ?? ''),
      pixCopyPaste: result.pixCopiaECola as string | undefined,
      pdfUrl: result.pdfUrl as string | undefined,
      status: String(result.situacao ?? ''),
      dueDate: String(result.dataVencimento ?? ''),
      amount: Number(result.valor ?? 0),
    };
  }

  // ─── BankingProvider: PIX (PIX V2) ───────────────────────────────────────

  async createPixCharge(data: CreatePixChargeInput): Promise<PixChargeResult> {
    const body: Record<string, unknown> = {
      calendario: { expiracao: data.expiresInSeconds ?? 3600 },
      valor: { original: data.amount.toFixed(2) },
      chave: data.pixKey,
      infoAdicionais: [{ nome: 'Descricao', valor: data.description }],
    };
    if (data.customerCpfCnpj) {
      body.devedor = {
        cpf:
          data.customerCpfCnpj.length === 11 ? data.customerCpfCnpj : undefined,
        cnpj:
          data.customerCpfCnpj.length === 14 ? data.customerCpfCnpj : undefined,
        nome: data.customerName ?? '',
      };
    }
    const result = await this.request('POST', '/pix/v2/cob', body);
    return {
      txId: String(result.txid ?? ''),
      status: String(result.status ?? ''),
      pixCopyPaste: String(result.pixCopiaECola ?? ''),
      qrCodeBase64: result.qrCodeBase64 as string | undefined,
      amount: data.amount,
      createdAt: String(
        (result.calendario as Record<string, string>)?.criacao ??
          new Date().toISOString(),
      ),
    };
  }

  async getPixCharge(txId: string): Promise<PixChargeResult> {
    const result = await this.request('GET', `/pix/v2/cob/${txId}`);
    const valor = result.valor as Record<string, string>;
    const calendario = result.calendario as Record<string, string>;
    return {
      txId: String(result.txid ?? txId),
      status: String(result.status ?? ''),
      pixCopyPaste: String(result.pixCopiaECola ?? ''),
      amount: parseFloat(valor?.original ?? '0'),
      createdAt: calendario?.criacao ?? '',
    };
  }

  async executePixPayment(
    data: ExecutePixPaymentInput,
  ): Promise<PaymentReceipt> {
    const body = {
      valor: data.amount.toFixed(2),
      pagador: { chave: data.recipientPixKey },
      favorecido: {
        nome: data.recipientName ?? '',
        cpfCnpj: data.recipientCpfCnpj ?? '',
      },
      descricao: data.description ?? '',
    };
    const result = await this.request('POST', '/pix/v2/pagamentos/pix', body);
    return {
      externalId: String(result.endToEndId ?? result.idTransacao ?? ''),
      method: 'PIX',
      amount: data.amount,
      status: String(result.status ?? 'PROCESSANDO'),
      executedAt: new Date().toISOString(),
      recipientName: data.recipientName,
      receiptData: result,
    };
  }

  // ─── BankingProvider: payments (TED + boleto payment) ────────────────────

  async executePayment(data: ExecutePaymentInput): Promise<PaymentReceipt> {
    if (data.method === 'TED') {
      const body = {
        valor: data.amount,
        contaDestino: {
          banco: data.recipientBankCode,
          agencia: data.recipientAgency,
          conta: data.recipientAccount,
          nome: data.recipientName,
          cpfCnpj: data.recipientCpfCnpj,
        },
      };
      const result = await this.request(
        'POST',
        '/conta-corrente/v4/transferencias/ted',
        body,
      );
      return {
        externalId: String(result.idTransacao ?? ''),
        method: 'TED',
        amount: data.amount,
        status: String(result.status ?? 'PROCESSANDO'),
        executedAt: new Date().toISOString(),
        recipientName: data.recipientName,
        receiptData: result,
      };
    }
    if (data.method === 'BOLETO' && data.barcode) {
      const body = {
        codigoBarras: data.barcode,
        valor: data.amount,
        dataVencimento: data.dueDate,
      };
      const result = await this.request('POST', '/pagamentos/v2/boletos', body);
      return {
        externalId: String(result.idPagamento ?? ''),
        method: 'BOLETO',
        amount: data.amount,
        status: String(result.status ?? 'PROCESSANDO'),
        executedAt: new Date().toISOString(),
        receiptData: result,
      };
    }
    throw new Error(`Unsupported payment method: ${data.method}`);
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentStatus> {
    const result = await this.request('GET', `/pagamentos/v2/${paymentId}`);
    const statusMap: Record<string, PaymentStatus['status']> = {
      PROCESSANDO: 'PROCESSING',
      REALIZADO: 'COMPLETED',
      AGENDADO: 'PENDING',
      REJEITADO: 'FAILED',
      DEVOLVIDO: 'RETURNED',
    };
    return {
      externalId: paymentId,
      status: statusMap[String(result.status ?? '')] ?? 'PENDING',
      amount: Number(result.valor ?? 0),
      executedAt: result.dataExecucao as string | undefined,
      errorMessage: result.mensagemErro as string | undefined,
    };
  }

  // ─── BankingProvider: webhooks ────────────────────────────────────────────

  async registerWebhook(url: string, _events: WebhookEvent[]): Promise<void> {
    await this.request('PUT', `/pix/v2/webhook/${this.config.accountNumber}`, {
      webhookUrl: url,
    });
  }

  async handleWebhookPayload(payload: unknown): Promise<WebhookResult> {
    const data = payload as Record<string, unknown>;
    const pix = (data.pix as Record<string, unknown>[])?.[0];
    if (pix) {
      return {
        eventType: 'PIX_RECEIVED',
        externalId: String(pix.txid ?? pix.endToEndId ?? ''),
        amount: parseFloat(String(pix.valor ?? '0')),
        paidAt: String(pix.horario ?? new Date().toISOString()),
        payerName: (pix.pagador as Record<string, string>)?.nome,
        payerCpfCnpj: (pix.pagador as Record<string, string>)?.cpf,
        rawPayload: data,
      };
    }
    throw new Error('Unknown webhook payload format');
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

  /**
   * Generic authenticated request helper.
   * Handles token acquisition, mTLS agent setup, and error unwrapping.
   */
  private async request(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<Record<string, unknown>> {
    const token = await this.getAccessToken();
    const agent = await this.buildAgent();

    const response = await fetch(`${SICOOB_API_BASE}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      // @ts-expect-error — Node.js fetch accepts agent for mTLS
      agent,
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(
        `Sicoob API error ${method} ${path} (${response.status}): ${JSON.stringify(errorBody)}`,
      );
    }

    // Some endpoints (e.g. PATCH baixar) return 204 No Content
    const text = await response.text();
    if (!text) return {};

    return JSON.parse(text) as Record<string, unknown>;
  }
}
