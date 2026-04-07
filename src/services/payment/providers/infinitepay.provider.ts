/**
 * InfinitePay payment provider.
 *
 * Base URL: https://api.infinitepay.io
 * Auth: Client ID + Client Secret (OAuth2 client_credentials)
 *
 * Endpoints:
 * - POST /invoices/public/checkout/links      — create checkout/payment
 * - POST /invoices/public/checkout/payment_check — check payment status
 *
 * IMPORTANT: InfinitePay has NO sandbox environment — all requests hit production.
 */

import type {
  PaymentProvider,
  PaymentMethod,
  CreateChargeInput,
  ChargeResult,
  ChargeStatus,
  WebhookResult,
  ConfigField,
} from '../payment-provider.interface';

const INFINITEPAY_BASE_URL = 'https://api.infinitepay.io';

export interface InfinitePayConfig {
  clientId: string;
  clientSecret: string;
}

export class InfinitePayProvider implements PaymentProvider {
  readonly name = 'infinitepay';
  readonly displayName = 'InfinitePay';
  readonly supportedMethods: PaymentMethod[] = [
    'PIX',
    'CREDIT_CARD',
    'DEBIT_CARD',
  ];

  private cachedAccessToken: string | null = null;
  private tokenExpirationDate: Date = new Date(0);

  constructor(private config: InfinitePayConfig) {}

  async createCharge(input: CreateChargeInput): Promise<ChargeResult> {
    try {
      const accessToken = await this.authenticate();

      const amountInReais = input.amount / 100;

      const body: Record<string, unknown> = {
        handle: input.orderNumber,
        order_nsu: input.orderId,
        items: [
          {
            quantity: 1,
            price: amountInReais,
            description: input.description || `Pedido ${input.orderNumber}`,
          },
        ],
        webhook_url: `${process.env.API_BASE_URL || 'https://api.example.com'}/v1/webhooks/infinitepay`,
      };

      if (input.customerName || input.customerDocument) {
        body.customer = {
          ...(input.customerName && { name: input.customerName }),
          ...(input.customerDocument && {
            document: input.customerDocument.replace(/\D/g, ''),
          }),
        };
      }

      if (input.expiresInMinutes) {
        body.expires_in = input.expiresInMinutes * 60;
      }

      const response = await this.request(
        accessToken,
        'POST',
        '/invoices/public/checkout/links',
        body,
      );

      const data = response as Record<string, unknown>;
      const checkoutUrl =
        (data.url as string) || (data.checkout_url as string) || '';
      const chargeId =
        (data.id as string) ||
        (data.invoice_slug as string) ||
        (data.slug as string) ||
        input.orderId;

      const result: ChargeResult = {
        chargeId,
        status: 'PENDING',
        checkoutUrl,
        rawResponse: data,
      };

      // For PIX: the checkout URL itself can be used as QR code payload
      if (input.method === 'PIX' && checkoutUrl) {
        result.qrCode = checkoutUrl;
      }

      if (input.expiresInMinutes) {
        result.expiresAt = new Date(
          Date.now() + input.expiresInMinutes * 60 * 1000,
        );
      }

      console.log(
        `[InfinitePay] Charge created: ${chargeId} for order ${input.orderNumber}`,
      );

      return result;
    } catch (error) {
      console.error('[InfinitePay] createCharge error:', error);
      throw new Error(
        `Falha ao criar cobrança via InfinitePay: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      );
    }
  }

  async checkStatus(chargeId: string): Promise<ChargeStatus> {
    try {
      const accessToken = await this.authenticate();

      const response = await this.request(
        accessToken,
        'POST',
        '/invoices/public/checkout/payment_check',
        { invoice_slug: chargeId },
      );

      const data = response as Record<string, unknown>;
      const providerStatus = (data.status as string) || '';

      return {
        status: this.mapStatus(providerStatus),
        paidAt: data.paid_at ? new Date(data.paid_at as string) : undefined,
        paidAmount: data.paid_amount
          ? Math.round(Number(data.paid_amount) * 100)
          : undefined,
      };
    } catch (error) {
      console.error('[InfinitePay] checkStatus error:', error);
      throw new Error(
        `Falha ao verificar status via InfinitePay: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      );
    }
  }

  async handleWebhook(
    payload: unknown,
    _headers: Record<string, string>,
  ): Promise<WebhookResult> {
    try {
      const data = payload as Record<string, unknown>;

      // TODO: Validate HMAC signature from headers when InfinitePay docs provide details
      // const signature = headers['x-infinitepay-signature'] || headers['x-signature']
      // validateHmacSignature(signature, payload, this.config.clientSecret)

      const chargeId =
        (data.invoice_slug as string) ||
        (data.id as string) ||
        (data.slug as string) ||
        '';
      const providerStatus = (data.status as string) || '';
      const paidAmount = data.paid_amount
        ? Math.round(Number(data.paid_amount) * 100)
        : data.amount
          ? Math.round(Number(data.amount) * 100)
          : undefined;

      const status = this.mapWebhookStatus(providerStatus);

      console.log(
        `[InfinitePay] Webhook received: charge=${chargeId} status=${providerStatus} → ${status}`,
      );

      return {
        chargeId,
        status,
        paidAmount,
        metadata: {
          transactionNsu: data.transaction_nsu,
          receiptUrl: data.receipt_url,
          rawStatus: providerStatus,
        },
      };
    } catch (error) {
      console.error('[InfinitePay] handleWebhook error:', error);
      throw new Error(
        `Falha ao processar webhook InfinitePay: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      );
    }
  }

  async testConnection(): Promise<{ ok: boolean; message: string }> {
    try {
      await this.authenticate();
      return {
        ok: true,
        message:
          'Autenticação realizada com sucesso. Atenção: InfinitePay não possui ambiente sandbox.',
      };
    } catch (error) {
      return {
        ok: false,
        message: `Falha na autenticação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      };
    }
  }

  getConfigFields(): ConfigField[] {
    return [
      {
        key: 'clientId',
        label: 'Client ID',
        type: 'text',
        required: true,
        placeholder: 'Encontre em Configurações > Credenciais',
        helpText:
          'ID do cliente fornecido pela InfinitePay no painel de integrações.',
      },
      {
        key: 'clientSecret',
        label: 'Client Secret',
        type: 'password',
        required: true,
        helpText:
          'Chave secreta fornecida pela InfinitePay. Nunca compartilhe esta chave.',
      },
    ];
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private async authenticate(): Promise<string> {
    if (this.cachedAccessToken && this.tokenExpirationDate > new Date()) {
      return this.cachedAccessToken;
    }

    const base64Credentials = Buffer.from(
      `${this.config.clientId}:${this.config.clientSecret}`,
    ).toString('base64');

    const tokenResponse = await fetch(`${INFINITEPAY_BASE_URL}/oauth/token`, {
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
        `InfinitePay OAuth failed (${tokenResponse.status}): ${JSON.stringify(errorBody)}`,
      );
    }

    const tokenData = (await tokenResponse.json()) as Record<string, unknown>;

    this.cachedAccessToken = tokenData.access_token as string;
    this.tokenExpirationDate = new Date(
      Date.now() + ((tokenData.expires_in as number) || 3600) * 1000,
    );

    console.log('[InfinitePay] Authenticated successfully');

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
      `${INFINITEPAY_BASE_URL}${path}`,
      requestOptions,
    );

    if (!httpResponse.ok) {
      const errorBody = await httpResponse.json().catch(() => ({}));
      throw new Error(
        `InfinitePay API error (${httpResponse.status}): ${JSON.stringify(errorBody)}`,
      );
    }

    const contentLength = httpResponse.headers.get('content-length');
    if (contentLength === '0') {
      return {};
    }

    return httpResponse.json() as Promise<Record<string, unknown>>;
  }

  private mapStatus(providerStatus: string): ChargeStatus['status'] {
    const normalized = providerStatus.toLowerCase();
    if (
      normalized === 'paid' ||
      normalized === 'approved' ||
      normalized === 'confirmed'
    ) {
      return 'PAID';
    }
    if (
      normalized === 'expired' ||
      normalized === 'canceled' ||
      normalized === 'cancelled'
    ) {
      return 'EXPIRED';
    }
    if (
      normalized === 'failed' ||
      normalized === 'rejected' ||
      normalized === 'error'
    ) {
      return 'FAILED';
    }
    if (normalized === 'refunded' || normalized === 'reversed') {
      return 'REFUNDED';
    }
    return 'PENDING';
  }

  private mapWebhookStatus(providerStatus: string): WebhookResult['status'] {
    const normalized = providerStatus.toLowerCase();
    if (
      normalized === 'paid' ||
      normalized === 'approved' ||
      normalized === 'confirmed'
    ) {
      return 'PAID';
    }
    if (
      normalized === 'expired' ||
      normalized === 'canceled' ||
      normalized === 'cancelled'
    ) {
      return 'EXPIRED';
    }
    if (normalized === 'refunded' || normalized === 'reversed') {
      return 'REFUNDED';
    }
    return 'FAILED';
  }
}
