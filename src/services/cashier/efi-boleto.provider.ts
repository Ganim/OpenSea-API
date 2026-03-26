/**
 * Efi (Gerencianet) Boleto provider.
 *
 * Base URL (sandbox): https://cobrancas-h.api.efipay.com.br
 * Base URL (production): https://cobrancas.api.efipay.com.br
 * Auth: OAuth2 client_credentials (same as PIX)
 *
 * Endpoints:
 * - POST /v1/charge              — create charge
 * - POST /v1/charge/{id}/pay     — set payment method (banking_billet)
 * - GET  /v1/charge/{id}         — query charge
 */

const EFI_BOLETO_URL =
  process.env.EFI_BOLETO_URL || 'https://cobrancas-h.api.efipay.com.br';
const EFI_CLIENT_ID = process.env.EFI_CLIENT_ID || '';
const EFI_CLIENT_SECRET = process.env.EFI_CLIENT_SECRET || '';

export interface BoletoResult {
  chargeId: number;
  barcodeNumber: string;
  digitableLine: string;
  pdfUrl: string;
  dueDate: string;
  amount: number;
}

export interface CreateBoletoParams {
  /** Amount in cents */
  amount: number;
  /** Due date in YYYY-MM-DD format */
  dueDate: string;
  customerName: string;
  customerCpfCnpj: string;
  description: string;
  instructions?: string[];
}

export class EfiBoletoProvider {
  readonly providerName = 'EFI_BOLETO';

  private cachedAccessToken: string | null = null;
  private tokenExpirationDate: Date = new Date(0);

  async createBoleto(params: CreateBoletoParams): Promise<BoletoResult> {
    const accessToken = await this.authenticate();

    // Step 1: Create charge
    const chargeBody: Record<string, unknown> = {
      items: [
        {
          name: params.description.substring(0, 255),
          value: params.amount,
          amount: 1,
        },
      ],
    };

    const chargeResponse = await this.request(
      accessToken,
      'POST',
      '/v1/charge',
      chargeBody,
    );

    const chargeData = chargeResponse.data as Record<string, unknown>;
    const chargeId = chargeData.charge_id as number;

    // Step 2: Set payment method to banking_billet
    const documentKey =
      params.customerCpfCnpj.replace(/\D/g, '').length <= 11 ? 'cpf' : 'cnpj';

    const payBody: Record<string, unknown> = {
      payment: {
        banking_billet: {
          expire_at: params.dueDate,
          customer: {
            name: params.customerName,
            [documentKey]: params.customerCpfCnpj.replace(/\D/g, ''),
          },
        },
      },
    };

    // Add instructions if provided (max 4)
    if (params.instructions && params.instructions.length > 0) {
      const billet = (payBody.payment as Record<string, unknown>)
        .banking_billet as Record<string, unknown>;
      billet.instructions = params.instructions.slice(0, 4);
    }

    const payResponse = await this.request(
      accessToken,
      'POST',
      `/v1/charge/${chargeId}/pay`,
      payBody,
    );

    const payData = payResponse.data as Record<string, unknown>;

    return {
      chargeId,
      barcodeNumber: (payData.barcode as string) || '',
      digitableLine: (payData.line as string) || '',
      pdfUrl:
        ((payData.pdf as Record<string, unknown>)?.charge as string) ||
        (payData.link as string) ||
        '',
      dueDate: params.dueDate,
      amount: params.amount,
    };
  }

  async getCharge(chargeId: number): Promise<{
    status: string;
    barcodeNumber?: string;
    digitableLine?: string;
    pdfUrl?: string;
  }> {
    const accessToken = await this.authenticate();

    const response = await this.request(
      accessToken,
      'GET',
      `/v1/charge/${chargeId}`,
    );

    const data = response.data as Record<string, unknown>;

    return {
      status: (data.status as string) || 'unknown',
      barcodeNumber: data.barcode as string | undefined,
      digitableLine: data.line as string | undefined,
      pdfUrl: ((data.pdf as Record<string, unknown>)?.charge as string) || undefined,
    };
  }

  private async authenticate(): Promise<string> {
    if (this.cachedAccessToken && this.tokenExpirationDate > new Date()) {
      return this.cachedAccessToken;
    }

    const base64Credentials = Buffer.from(
      `${EFI_CLIENT_ID}:${EFI_CLIENT_SECRET}`,
    ).toString('base64');

    const tokenResponse = await fetch(`${EFI_BOLETO_URL}/oauth/token`, {
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
        `Efi Boleto OAuth token request failed (${tokenResponse.status}): ${JSON.stringify(errorBody)}`,
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

    const httpResponse = await fetch(
      `${EFI_BOLETO_URL}${path}`,
      requestOptions,
    );

    if (!httpResponse.ok) {
      const errorBody = await httpResponse.json().catch(() => ({}));
      throw new Error(
        `Efi Boleto API error (${httpResponse.status}): ${JSON.stringify(errorBody)}`,
      );
    }

    const contentLength = httpResponse.headers.get('content-length');
    if (contentLength === '0') {
      return {};
    }

    return httpResponse.json() as Promise<Record<string, unknown>>;
  }
}
