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

/** Injectable HTTP function for mTLS requests. Defaults to https.request. */
export type HttpRequestFn = (
  url: string,
  options: {
    method: string;
    headers: Record<string, string>;
    body?: string;
    agent: https.Agent;
  },
) => Promise<{ status: number; body: string }>;

export interface SicoobProviderConfig {
  clientId: string;
  certFileId: string;
  keyFileId: string;
  scopes: string[];
  accountNumber: string;
  agency: string;
  pixKey?: string;
  certLoader: {
    loadCertBuffers(
      certFileId: string,
      keyFileId: string,
    ): Promise<{
      cert: Buffer;
      key: Buffer;
    }>;
  };
  /** Override HTTP transport (for testing). Defaults to https.request. */
  httpRequest?: HttpRequestFn;
}

// ─── Provider ────────────────────────────────────────────────────────────────

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
  private tokenExpiresAt = 0;
  private cachedAgent: https.Agent | null = null;

  constructor(private readonly config: SicoobProviderConfig) {}

  // ─── Auth ───────────────────────────────────────────────────────────────

  async authenticate(): Promise<void> {
    await this.getAccessToken();
  }

  // ─── Read ───────────────────────────────────────────────────────────────

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
    const data = await this.request(
      'GET',
      `/conta-corrente/v4/contas/${accountId}/saldo`,
    );

    const saldo = data.saldo as Record<string, number> | undefined;
    const disponivel = saldo?.disponivel ?? 0;
    const bloqueado = saldo?.bloqueado ?? 0;

    return {
      available: disponivel,
      current: disponivel + bloqueado,
      currency: 'BRL',
      updatedAt: new Date().toISOString(),
    };
  }

  async getTransactions(
    accountId: string,
    from: string,
    to: string,
  ): Promise<BankTransaction[]> {
    const data = await this.request(
      'GET',
      `/conta-corrente/v4/contas/${accountId}/extrato?dataInicio=${from}&dataFim=${to}`,
    );

    const transacoes = (data.transacoes ?? []) as Array<{
      id: string;
      data: string;
      descricao: string;
      valor: number;
    }>;

    return transacoes.map((tx) => ({
      id: tx.id,
      date: tx.data,
      description: tx.descricao,
      amount: tx.valor,
      type: (tx.valor >= 0 ? 'CREDIT' : 'DEBIT') as BankTransaction['type'],
    }));
  }

  // ─── Boleto (Cobrança Bancária V3) ──────────────────────────────────────

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
      { motivo: 'SOLICITACAO_CEDENTE' },
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

  // ─── PIX (V2) ───────────────────────────────────────────────────────────

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
          data.customerCpfCnpj.length === 11
            ? data.customerCpfCnpj
            : undefined,
        cnpj:
          data.customerCpfCnpj.length === 14
            ? data.customerCpfCnpj
            : undefined,
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
      favorecido: {
        chave: data.recipientPixKey,
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

  // ─── Payments (TED / Boleto) ────────────────────────────────────────────

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

  // ─── Webhook ────────────────────────────────────────────────────────────

  async registerWebhook(
    url: string,
    _events: WebhookEvent[],
  ): Promise<void> {
    const pixKey = this.config.pixKey ?? this.config.accountNumber;
    await this.request('PUT', `/pix/v2/webhook/${pixKey}`, {
      webhookUrl: url,
    });
  }

  async handleWebhookPayload(payload: unknown): Promise<WebhookResult> {
    const data = payload as Record<string, unknown>;

    // PIX webhook
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

    // Boleto webhook (cobrança bancária)
    const boleto = data.boleto as Record<string, unknown> | undefined;
    if (boleto) {
      return {
        eventType: 'BOLETO_PAID',
        externalId: String(boleto.nossoNumero ?? ''),
        amount: Number(boleto.valorPago ?? boleto.valor ?? 0),
        paidAt: String(boleto.dataPagamento ?? new Date().toISOString()),
        payerName: (boleto.pagador as Record<string, string>)?.nome,
        payerCpfCnpj: (boleto.pagador as Record<string, string>)?.cpf,
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

    const agent = await this.getAgent();
    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: this.config.clientId,
      scope: this.config.scopes.join(' '),
    });

    const data = await this.httpsRequest<{
      access_token: string;
      expires_in: number;
    }>(SICOOB_AUTH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
      agent,
    });

    this.cachedToken = data.access_token;
    this.tokenExpiresAt = nowMs + data.expires_in * 1000;

    return this.cachedToken;
  }

  /**
   * Cached https.Agent with mTLS certificates.
   * Downloaded from Storage once and reused across all requests.
   */
  private async getAgent(): Promise<https.Agent> {
    if (this.cachedAgent) return this.cachedAgent;

    const { cert, key } = await this.config.certLoader.loadCertBuffers(
      this.config.certFileId,
      this.config.keyFileId,
    );

    this.cachedAgent = new https.Agent({
      cert,
      key,
      keepAlive: true,
    });

    return this.cachedAgent;
  }

  /** Invalidate cached agent (call when certificates are updated). */
  invalidateAgent(): void {
    if (this.cachedAgent) {
      this.cachedAgent.destroy();
      this.cachedAgent = null;
    }
  }

  /**
   * Authenticated request to Sicoob API.
   * Uses the shared `httpsRequest` helper with cached token + agent.
   */
  private async request(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<Record<string, unknown>> {
    const token = await this.getAccessToken();
    const agent = await this.getAgent();

    return this.httpsRequest(`${SICOOB_API_BASE}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      agent,
    });
  }

  /**
   * Low-level HTTPS request with mTLS support.
   * Uses injectable httpRequest (defaults to https.request wrapper)
   * because Node.js `fetch` (undici) does NOT support `https.Agent` for mTLS.
   */
  private async httpsRequest<T = Record<string, unknown>>(
    url: string,
    options: {
      method: string;
      headers: Record<string, string>;
      body?: string;
      agent: https.Agent;
    },
  ): Promise<T> {
    const transport = this.config.httpRequest ?? defaultHttpsRequest;
    const response = await transport(url, options);

    if (response.status < 200 || response.status >= 300) {
      const parsedUrl = new URL(url);
      throw new Error(
        `Sicoob API error ${options.method} ${parsedUrl.pathname} (${response.status}): ${response.body}`,
      );
    }

    if (!response.body || response.status === 204) {
      return {} as T;
    }

    return JSON.parse(response.body) as T;
  }
}

// ─── Default HTTPS transport (mTLS via https.request) ──────────────────────

const defaultHttpsRequest: HttpRequestFn = (url, options) => {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);

    const req = https.request(
      {
        hostname: parsedUrl.hostname,
        port: Number(parsedUrl.port) || 443,
        path: parsedUrl.pathname + parsedUrl.search,
        method: options.method,
        headers: options.headers,
        agent: options.agent,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => {
          resolve({
            status: res.statusCode ?? 500,
            body: Buffer.concat(chunks).toString('utf8'),
          });
        });
      },
    );

    req.on('error', reject);

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
};
