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

  it('should throw "Not implemented yet" for createBoleto', async () => {
    const provider = makeProvider();
    await expect(
      provider.createBoleto({
        amount: 100,
        dueDate: '2024-12-01',
        customerName: 'Test',
        customerCpfCnpj: '00000000000',
        description: 'Test',
      }),
    ).rejects.toThrow('Not implemented yet');
  });

  it('should throw "Not implemented yet" for createPixCharge', async () => {
    const provider = makeProvider();
    await expect(
      provider.createPixCharge({
        amount: 100,
        pixKey: 'test@test.com',
        description: 'Test',
      }),
    ).rejects.toThrow('Not implemented yet');
  });
});
