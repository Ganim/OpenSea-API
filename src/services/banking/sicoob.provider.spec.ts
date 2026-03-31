import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SicoobProvider } from './sicoob.provider';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeCertLoader() {
  return {
    loadCertBuffers: vi.fn().mockResolvedValue({
      cert: Buffer.from('CERT'),
      key: Buffer.from('KEY'),
    }),
  };
}

function makeAuthResponse(expiresIn = 3600) {
  return {
    ok: true,
    json: vi.fn().mockResolvedValue({
      access_token: 'test-access-token',
      expires_in: expiresIn,
    }),
  };
}

function makeProvider() {
  return new SicoobProvider({
    clientId: 'my-client-id',
    certFileId: 'cert-file-id',
    keyFileId: 'key-file-id',
    scopes: ['cobranca.read', 'extrato.read'],
    accountNumber: '123456',
    agency: '0001',
    certLoader: makeCertLoader(),
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('SicoobProvider', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should have full capabilities', () => {
    const provider = makeProvider();
    expect(provider.capabilities).toEqual([
      'READ',
      'BOLETO',
      'PIX',
      'PAYMENT',
      'TED',
    ]);
    expect(provider.providerName).toBe('SICOOB');
  });

  it('should authenticate with OAuth2 mTLS (client_credentials grant)', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(makeAuthResponse());
    vi.stubGlobal('fetch', mockFetch);

    const provider = makeProvider();
    await provider.authenticate();

    expect(mockFetch).toHaveBeenCalledOnce();

    const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      'https://auth.sicoob.com.br/auth/realms/cooperado/protocol/openid-connect/token',
    );
    expect(options.method).toBe('POST');
    expect((options.headers as Record<string, string>)['Content-Type']).toBe(
      'application/x-www-form-urlencoded',
    );

    const body = options.body as string;
    expect(body).toContain('grant_type=client_credentials');
    expect(body).toContain('client_id=my-client-id');
    expect(body).toContain('scope=cobranca.read+extrato.read');
  });

  it('should cache the token and not call fetch again on second authenticate()', async () => {
    const mockFetch = vi.fn().mockResolvedValue(makeAuthResponse(3600));
    vi.stubGlobal('fetch', mockFetch);

    const provider = makeProvider();
    await provider.authenticate();
    await provider.authenticate();

    // Token is still valid — should only authenticate once
    expect(mockFetch).toHaveBeenCalledOnce();
  });

  it('should get balance for an account', async () => {
    const mockFetch = vi
      .fn()
      // First call: auth
      .mockResolvedValueOnce(makeAuthResponse())
      // Second call: balance endpoint
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          saldo: { disponivel: 1500.75, bloqueado: 200.0 },
        }),
      });

    vi.stubGlobal('fetch', mockFetch);

    const provider = makeProvider();
    const balance = await provider.getBalance('123456');

    expect(balance.available).toBe(1500.75);
    expect(balance.current).toBe(1300.75); // disponivel - bloqueado
    expect(balance.currency).toBe('BRL');
    expect(balance.updatedAt).toBeDefined();

    // Verify the balance URL
    const [balanceUrl, balanceOptions] = mockFetch.mock.calls[1] as [
      string,
      RequestInit,
    ];
    expect(balanceUrl).toBe(
      'https://api.sicoob.com.br/conta-corrente/v4/contas/123456/saldo',
    );
    expect(balanceOptions.method).toBe('GET');
    expect(
      (balanceOptions.headers as Record<string, string>)['Authorization'],
    ).toBe('Bearer test-access-token');
  });

  it('should get transactions and map them correctly', async () => {
    const mockFetch = vi
      .fn()
      // First call: auth
      .mockResolvedValueOnce(makeAuthResponse())
      // Second call: statement endpoint
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          transacoes: [
            {
              id: 'tx-1',
              data: '2024-01-15',
              descricao: 'PIX recebido',
              valor: 500.0,
              tipo: 'C',
            },
            {
              id: 'tx-2',
              data: '2024-01-16',
              descricao: 'Débito automático',
              valor: -150.0,
              tipo: 'D',
            },
          ],
        }),
      });

    vi.stubGlobal('fetch', mockFetch);

    const provider = makeProvider();
    const transactions = await provider.getTransactions(
      '123456',
      '2024-01-01',
      '2024-01-31',
    );

    expect(transactions).toHaveLength(2);

    expect(transactions[0]).toMatchObject({
      id: 'tx-1',
      date: '2024-01-15',
      description: 'PIX recebido',
      amount: 500.0,
      type: 'CREDIT',
    });

    expect(transactions[1]).toMatchObject({
      id: 'tx-2',
      date: '2024-01-16',
      description: 'Débito automático',
      amount: -150.0,
      type: 'DEBIT',
    });

    // Verify the statement URL includes date params
    const [statementUrl] = mockFetch.mock.calls[1] as [string];
    expect(statementUrl).toContain('/conta-corrente/v4/contas/123456/extrato');
    expect(statementUrl).toContain('dataInicio=2024-01-01');
    expect(statementUrl).toContain('dataFim=2024-01-31');
  });

  it('should return the configured account from getAccounts()', async () => {
    const provider = makeProvider();
    const accounts = await provider.getAccounts();

    expect(accounts).toHaveLength(1);
    expect(accounts[0]).toMatchObject({
      number: '123456',
      type: 'BANK',
      currencyCode: 'BRL',
    });
  });

  // ─── Boleto ────────────────────────────────────────────────────────────────

  it('should create a boleto and return mapped result', async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(makeAuthResponse())
      .mockResolvedValueOnce({
        ok: true,
        text: vi.fn().mockResolvedValue(
          JSON.stringify({
            nossoNumero: '00012345',
            codigoBarras:
              '12345.67890 12345.678901 12345.678901 1 12340000010000',
            linhaDigitavel: '1234567890 1234567890 1234567890 1 12340000010000',
            pixCopiaECola: 'pix-copy-paste-code',
            pdfUrl: 'https://sicoob.com.br/boleto.pdf',
          }),
        ),
      });
    vi.stubGlobal('fetch', mockFetch);

    const provider = makeProvider();
    const result = await provider.createBoleto({
      amount: 150.0,
      dueDate: '2024-12-01',
      customerName: 'João Silva',
      customerCpfCnpj: '12345678901',
      description: 'Pagamento de serviço',
    });

    expect(result.nossoNumero).toBe('00012345');
    expect(result.barcode).toContain('12345');
    expect(result.pixCopyPaste).toBe('pix-copy-paste-code');
    expect(result.status).toBe('REGISTERED');
    expect(result.amount).toBe(150.0);
  });

  it('should cancel a boleto without throwing', async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(makeAuthResponse())
      .mockResolvedValueOnce({
        ok: true,
        text: vi.fn().mockResolvedValue(''),
      });
    vi.stubGlobal('fetch', mockFetch);

    const provider = makeProvider();
    await expect(provider.cancelBoleto('00012345')).resolves.toBeUndefined();

    const [patchUrl, patchOptions] = mockFetch.mock.calls[1] as [
      string,
      RequestInit,
    ];
    expect(patchUrl).toContain('/cobranca-bancaria/v3/boletos/00012345/baixar');
    expect(patchOptions.method).toBe('PATCH');
  });

  // ─── PIX ───────────────────────────────────────────────────────────────────

  it('should create a PIX charge and return mapped result', async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(makeAuthResponse())
      .mockResolvedValueOnce({
        ok: true,
        text: vi.fn().mockResolvedValue(
          JSON.stringify({
            txid: 'txid-abc-123',
            status: 'ATIVA',
            pixCopiaECola: 'pix-copia-e-cola-string',
            qrCodeBase64: 'base64imagedata',
            calendario: { criacao: '2024-01-15T10:00:00Z', expiracao: 3600 },
            valor: { original: '99.90' },
          }),
        ),
      });
    vi.stubGlobal('fetch', mockFetch);

    const provider = makeProvider();
    const result = await provider.createPixCharge({
      amount: 99.9,
      pixKey: 'empresa@email.com',
      description: 'Cobrança PIX',
    });

    expect(result.txId).toBe('txid-abc-123');
    expect(result.status).toBe('ATIVA');
    expect(result.pixCopyPaste).toBe('pix-copia-e-cola-string');
    expect(result.amount).toBe(99.9);
  });

  it('should execute a PIX payment and return receipt', async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(makeAuthResponse())
      .mockResolvedValueOnce({
        ok: true,
        text: vi.fn().mockResolvedValue(
          JSON.stringify({
            endToEndId: 'E1234567890',
            status: 'PROCESSANDO',
          }),
        ),
      });
    vi.stubGlobal('fetch', mockFetch);

    const provider = makeProvider();
    const result = await provider.executePixPayment({
      amount: 200.0,
      recipientPixKey: 'recipiente@email.com',
      recipientName: 'Maria Santos',
      description: 'Pagamento',
    });

    expect(result.externalId).toBe('E1234567890');
    expect(result.method).toBe('PIX');
    expect(result.amount).toBe(200.0);
  });

  // ─── Payments (TED) ────────────────────────────────────────────────────────

  it('should execute a TED payment and return receipt', async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(makeAuthResponse())
      .mockResolvedValueOnce({
        ok: true,
        text: vi.fn().mockResolvedValue(
          JSON.stringify({
            idTransacao: 'TED-987654',
            status: 'PROCESSANDO',
          }),
        ),
      });
    vi.stubGlobal('fetch', mockFetch);

    const provider = makeProvider();
    const result = await provider.executePayment({
      method: 'TED',
      amount: 500.0,
      recipientName: 'Carlos Oliveira',
      recipientCpfCnpj: '98765432100',
      recipientBankCode: '756',
      recipientAgency: '0001',
      recipientAccount: '123456-7',
    });

    expect(result.externalId).toBe('TED-987654');
    expect(result.method).toBe('TED');
    expect(result.amount).toBe(500.0);

    const [tedUrl, tedOptions] = mockFetch.mock.calls[1] as [
      string,
      RequestInit,
    ];
    expect(tedUrl).toContain('/conta-corrente/v4/transferencias/ted');
    expect(tedOptions.method).toBe('POST');
  });

  it('should throw for unsupported payment method', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(makeAuthResponse());
    vi.stubGlobal('fetch', mockFetch);

    const provider = makeProvider();
    await expect(
      provider.executePayment({
        method: 'UNKNOWN' as 'TED',
        amount: 100,
      }),
    ).rejects.toThrow('Unsupported payment method: UNKNOWN');
  });

  // ─── Webhooks ──────────────────────────────────────────────────────────────

  it('should parse a PIX webhook payload correctly', async () => {
    const provider = makeProvider();
    const payload = {
      pix: [
        {
          txid: 'txid-webhook-001',
          endToEndId: 'E1234567890',
          valor: '75.50',
          horario: '2024-01-15T14:30:00Z',
          pagador: { nome: 'Fulano da Silva', cpf: '11122233344' },
        },
      ],
    };

    const result = await provider.handleWebhookPayload(payload);

    expect(result.eventType).toBe('PIX_RECEIVED');
    expect(result.externalId).toBe('txid-webhook-001');
    expect(result.amount).toBe(75.5);
    expect(result.paidAt).toBe('2024-01-15T14:30:00Z');
    expect(result.payerName).toBe('Fulano da Silva');
    expect(result.payerCpfCnpj).toBe('11122233344');
  });

  it('should throw for unknown webhook payload format', async () => {
    const provider = makeProvider();
    await expect(
      provider.handleWebhookPayload({ unknown: 'data' }),
    ).rejects.toThrow('Unknown webhook payload format');
  });
});
