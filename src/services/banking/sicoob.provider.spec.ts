import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SicoobProvider } from './sicoob.provider';
import type { HttpRequestFn } from './sicoob.provider';

// ─── Mock HTTP transport ────────────────────────────────────────────────────

function createMockHttp(): {
  fn: HttpRequestFn;
  queue: Array<{ status: number; body: unknown }>;
} {
  const queue: Array<{ status: number; body: unknown }> = [];

  const fn: HttpRequestFn = vi.fn(async () => {
    const next = queue.shift() ?? { status: 200, body: {} };
    return {
      status: next.status,
      body: typeof next.body === 'string' ? next.body : JSON.stringify(next.body),
    };
  });

  return { fn, queue };
}

function makeCertLoader() {
  return {
    loadCertBuffers: vi.fn().mockResolvedValue({
      cert: Buffer.from('mock-cert'),
      key: Buffer.from('mock-key'),
    }),
  };
}

function makeProvider(http: { fn: HttpRequestFn }) {
  return new SicoobProvider({
    clientId: 'my-client-id',
    certFileId: 'cert-file-id',
    keyFileId: 'key-file-id',
    scopes: ['cobranca.read', 'extrato.read'],
    accountNumber: '123456',
    agency: '0001',
    pixKey: '12345678901',
    certLoader: makeCertLoader(),
    httpRequest: http.fn,
  });
}

function queueAuth(queue: Array<{ status: number; body: unknown }>) {
  queue.push({
    status: 200,
    body: { access_token: 'test-token', expires_in: 3600 },
  });
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('SicoobProvider', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should have full capabilities', () => {
    const http = createMockHttp();
    const provider = makeProvider(http);
    expect(provider.capabilities).toEqual([
      'READ', 'BOLETO', 'PIX', 'PAYMENT', 'TED',
    ]);
    expect(provider.providerName).toBe('SICOOB');
  });

  it('should authenticate with OAuth2 mTLS', async () => {
    const http = createMockHttp();
    queueAuth(http.queue);

    const provider = makeProvider(http);
    await provider.authenticate();

    expect(http.fn).toHaveBeenCalledOnce();
    const [url] = (http.fn as ReturnType<typeof vi.fn>).mock.calls[0] as [string];
    expect(url).toContain('auth.sicoob.com.br');
  });

  it('should get balance', async () => {
    const http = createMockHttp();
    queueAuth(http.queue);
    http.queue.push({
      status: 200,
      body: { saldo: { disponivel: 15000.5, bloqueado: 2000 } },
    });

    const provider = makeProvider(http);
    const balance = await provider.getBalance('123456');

    expect(balance.available).toBe(15000.5);
    expect(balance.current).toBe(17000.5);
    expect(balance.currency).toBe('BRL');
  });

  it('should get transactions', async () => {
    const http = createMockHttp();
    queueAuth(http.queue);
    http.queue.push({
      status: 200,
      body: {
        transacoes: [
          { id: 'tx1', data: '2026-03-30', descricao: 'PIX recebido', valor: 500 },
          { id: 'tx2', data: '2026-03-30', descricao: 'Pagamento', valor: -200 },
        ],
      },
    });

    const provider = makeProvider(http);
    const txs = await provider.getTransactions('123456', '2026-03-01', '2026-03-31');

    expect(txs).toHaveLength(2);
    expect(txs[0].type).toBe('CREDIT');
    expect(txs[1].type).toBe('DEBIT');
  });

  it('should create a hybrid boleto', async () => {
    const http = createMockHttp();
    queueAuth(http.queue);
    http.queue.push({
      status: 200,
      body: {
        nossoNumero: '00012345',
        codigoBarras: '23793.38128',
        linhaDigitavel: '23793381281234500000',
        pixCopiaECola: '00020126...',
      },
    });

    const provider = makeProvider(http);
    const result = await provider.createBoleto({
      amount: 150, dueDate: '2026-04-15',
      customerName: 'João', customerCpfCnpj: '12345678901',
      description: 'Mensalidade', isHybrid: true,
    });

    expect(result.nossoNumero).toBe('00012345');
    expect(result.pixCopyPaste).toBe('00020126...');
    expect(result.status).toBe('REGISTERED');
  });

  it('should cancel a boleto', async () => {
    const http = createMockHttp();
    queueAuth(http.queue);
    http.queue.push({ status: 204, body: '' });

    const provider = makeProvider(http);
    await expect(provider.cancelBoleto('00012345')).resolves.not.toThrow();
  });

  it('should create a PIX charge', async () => {
    const http = createMockHttp();
    queueAuth(http.queue);
    http.queue.push({
      status: 200,
      body: {
        txid: 'tx123abc', status: 'ATIVA',
        pixCopiaECola: '00020126580014br.gov.bcb.pix...',
        calendario: { criacao: '2026-03-31T10:00:00Z' },
      },
    });

    const provider = makeProvider(http);
    const result = await provider.createPixCharge({
      amount: 100, pixKey: '12345678901', description: 'Serviço',
    });

    expect(result.txId).toBe('tx123abc');
    expect(result.status).toBe('ATIVA');
  });

  it('should execute a PIX payment', async () => {
    const http = createMockHttp();
    queueAuth(http.queue);
    http.queue.push({
      status: 200,
      body: { endToEndId: 'E756123456789', status: 'REALIZADO' },
    });

    const provider = makeProvider(http);
    const receipt = await provider.executePixPayment({
      amount: 250, recipientPixKey: 'joao@email.com',
      recipientName: 'João', description: 'Pagamento',
    });

    expect(receipt.externalId).toBe('E756123456789');
    expect(receipt.method).toBe('PIX');
  });

  it('should execute a TED payment', async () => {
    const http = createMockHttp();
    queueAuth(http.queue);
    http.queue.push({
      status: 200,
      body: { idTransacao: 'ted-001', status: 'PROCESSANDO' },
    });

    const provider = makeProvider(http);
    const receipt = await provider.executePayment({
      method: 'TED', amount: 5000,
      recipientBankCode: '001', recipientAgency: '1234',
      recipientAccount: '56789-0', recipientName: 'Empresa XYZ',
    });

    expect(receipt.externalId).toBe('ted-001');
    expect(receipt.method).toBe('TED');
  });

  it('should throw for unsupported payment method', async () => {
    const http = createMockHttp();
    const provider = makeProvider(http);
    await expect(
      provider.executePayment({ method: 'BOLETO', amount: 100 }),
    ).rejects.toThrow('Unsupported payment method');
  });

  it('should parse a PIX webhook', async () => {
    const http = createMockHttp();
    const provider = makeProvider(http);
    const result = await provider.handleWebhookPayload({
      pix: [{
        txid: 'tx999', valor: '350.00',
        horario: '2026-03-31T14:30:00Z',
        pagador: { nome: 'Maria', cpf: '99988877766' },
      }],
    });

    expect(result.eventType).toBe('PIX_RECEIVED');
    expect(result.amount).toBe(350);
    expect(result.payerName).toBe('Maria');
  });

  it('should parse a boleto webhook', async () => {
    const http = createMockHttp();
    const provider = makeProvider(http);
    const result = await provider.handleWebhookPayload({
      boleto: {
        nossoNumero: '00012345', valorPago: 150,
        dataPagamento: '2026-04-01',
        pagador: { nome: 'José', cpf: '11122233344' },
      },
    });

    expect(result.eventType).toBe('BOLETO_PAID');
    expect(result.externalId).toBe('00012345');
  });

  it('should throw for unknown webhook format', async () => {
    const http = createMockHttp();
    const provider = makeProvider(http);
    await expect(
      provider.handleWebhookPayload({ unknown: true }),
    ).rejects.toThrow('Unknown webhook payload format');
  });

  it('should throw on API error', async () => {
    const http = createMockHttp();
    queueAuth(http.queue);
    http.queue.push({ status: 500, body: { error: 'internal' } });

    const provider = makeProvider(http);
    await expect(
      provider.getBalance('123456'),
    ).rejects.toThrow('Sicoob API error');
  });
});
