import type {
  CreatePixChargeParams,
  PixChargeResult,
  PixProvider,
  PixWebhookEvent,
} from './pix-provider.interface';

const EFI_API_URL =
  process.env.EFI_PIX_URL || 'https://pix-h.api.efipay.com.br';
const EFI_CLIENT_ID = process.env.EFI_CLIENT_ID || '';
const EFI_CLIENT_SECRET = process.env.EFI_CLIENT_SECRET || '';

/**
 * Efi (Gerencianet) PIX provider.
 *
 * Base URL (sandbox): https://pix-h.api.efipay.com.br
 * Base URL (production): https://pix.api.efipay.com.br
 * Auth: OAuth2 client_credentials (mTLS in production)
 *
 * Endpoints:
 * - PUT  /v2/cob/{txid}    — create immediate charge
 * - PATCH /v2/cob/{txid}   — update/cancel charge
 * - GET  /v2/cob/{txid}    — query charge status
 */
export class EfiPixProvider implements PixProvider {
  readonly providerName = 'EFI';

  private cachedAccessToken: string | null = null;
  private tokenExpirationDate: Date = new Date(0);

  async createCharge(params: CreatePixChargeParams): Promise<PixChargeResult> {
    const accessToken = await this.authenticate();

    const chargeExpirationSeconds = params.expirationSeconds || 3600;

    const chargeBody: Record<string, unknown> = {
      calendario: {
        expiracao: chargeExpirationSeconds,
      },
      valor: {
        original: params.amount.toFixed(2),
      },
    };

    if (params.description) {
      chargeBody.solicitacaoPagador = params.description;
    }

    if (params.payerCpfCnpj) {
      const documentKey = params.payerCpfCnpj.length <= 11 ? 'cpf' : 'cnpj';
      chargeBody.devedor = {
        [documentKey]: params.payerCpfCnpj,
        nome: params.payerName || '',
      };
    }

    const chargeResponse = await this.request(
      accessToken,
      'PUT',
      `/v2/cob/${params.txId}`,
      chargeBody,
    );

    return {
      txId: chargeResponse.txid as string,
      location:
        ((chargeResponse.loc as Record<string, unknown>)?.location as string) ||
        (chargeResponse.location as string) ||
        '',
      pixCopiaECola:
        (chargeResponse.pixCopiaECola as string) ||
        (chargeResponse.pix_copia_e_cola as string) ||
        '',
      expiresAt: new Date(Date.now() + chargeExpirationSeconds * 1000),
    };
  }

  async cancelCharge(txId: string): Promise<void> {
    const accessToken = await this.authenticate();

    await this.request(accessToken, 'PATCH', `/v2/cob/${txId}`, {
      status: 'REMOVIDA_PELO_USUARIO_RECEBEDOR',
    });
  }

  async queryCharge(txId: string): Promise<{ status: string; paidAt?: Date }> {
    const accessToken = await this.authenticate();

    const chargeResponse = await this.request(
      accessToken,
      'GET',
      `/v2/cob/${txId}`,
    );

    const pixPayments = chargeResponse.pix as
      | Record<string, unknown>[]
      | undefined;
    const firstPayment = pixPayments?.[0];

    return {
      status: chargeResponse.status as string,
      paidAt: firstPayment
        ? new Date(firstPayment.horario as string)
        : undefined,
    };
  }

  async parseWebhook(payload: unknown): Promise<PixWebhookEvent> {
    const webhookData = payload as Record<string, unknown>;
    const pixPayments = webhookData.pix as
      | Record<string, unknown>[]
      | undefined;
    const pixPayment = pixPayments?.[0] || webhookData;

    const payerInfo =
      (pixPayment.pagador as Record<string, unknown>) ||
      (pixPayment.infoPagador as Record<string, unknown>);

    return {
      txId: pixPayment.txid as string,
      endToEndId: pixPayment.endToEndId as string,
      payerName: payerInfo?.nome as string | undefined,
      payerCpfCnpj:
        (payerInfo?.cpf as string) || (payerInfo?.cnpj as string) || undefined,
      amount: parseFloat(pixPayment.valor as string),
      paidAt: new Date(pixPayment.horario as string),
    };
  }

  verifyWebhook(_payload: unknown, _signature: string): boolean {
    // Efi uses mTLS (client certificate) for webhook authentication.
    // In production, the webhook endpoint should require the Efi CA certificate
    // at the reverse-proxy / TLS termination layer.
    // For development/sandbox, accept all webhook calls.
    return true;
  }

  private async authenticate(): Promise<string> {
    if (this.cachedAccessToken && this.tokenExpirationDate > new Date()) {
      return this.cachedAccessToken;
    }

    const base64Credentials = Buffer.from(
      `${EFI_CLIENT_ID}:${EFI_CLIENT_SECRET}`,
    ).toString('base64');

    const tokenResponse = await fetch(`${EFI_API_URL}/oauth/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${base64Credentials}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ grant_type: 'client_credentials' }),
    });

    if (!tokenResponse.ok) {
      const errorBody = await tokenResponse.json().catch(() => ({}));
      throw new Error(
        `Efi OAuth token request failed (${tokenResponse.status}): ${JSON.stringify(errorBody)}`,
      );
    }

    const tokenData = (await tokenResponse.json()) as Record<string, unknown>;

    this.cachedAccessToken = tokenData.access_token as string;
    this.tokenExpirationDate = new Date(
      Date.now() + (tokenData.expires_in as number) * 1000,
    );

    return this.cachedAccessToken;
  }

  private async request(
    token: string,
    method: string,
    path: string,
    body?: unknown,
  ): Promise<Record<string, unknown>> {
    const requestOptions: RequestInit = {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    };

    if (body && method !== 'GET') {
      requestOptions.body = JSON.stringify(body);
    }

    const httpResponse = await fetch(`${EFI_API_URL}${path}`, requestOptions);

    if (!httpResponse.ok) {
      const errorBody = await httpResponse.json().catch(() => ({}));
      throw new Error(
        `Efi API error (${httpResponse.status}): ${JSON.stringify(errorBody)}`,
      );
    }

    const contentLength = httpResponse.headers.get('content-length');
    if (method === 'PATCH' || contentLength === '0') {
      return {};
    }

    return httpResponse.json() as Promise<Record<string, unknown>>;
  }
}
