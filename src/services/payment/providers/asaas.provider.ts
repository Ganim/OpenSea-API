/**
 * Asaas payment provider.
 *
 * Sandbox: https://sandbox.asaas.com/api/v3
 * Production: https://api.asaas.com/v3
 * Auth: Header `access_token: YOUR_API_KEY`
 *
 * Endpoints:
 * - POST /payments       — create payment (PIX, card, boleto)
 * - GET  /payments/:id   — check payment status
 * - POST /customers      — create/find customer (required for payments)
 * - GET  /customers?cpfCnpj=... — find customer by document
 * - GET  /myAccount      — account info (health check)
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

export interface AsaasConfig {
  apiKey: string;
  environment: 'sandbox' | 'production';
}

/** Asaas billing type mapping */
const METHOD_TO_BILLING_TYPE: Record<string, string> = {
  PIX: 'PIX',
  CREDIT_CARD: 'CREDIT_CARD',
  DEBIT_CARD: 'DEBIT_CARD',
  BOLETO: 'BOLETO',
  PAYMENT_LINK: 'UNDEFINED', // Asaas generates a link for UNDEFINED billing type
};

export class AsaasProvider implements PaymentProvider {
  readonly name = 'asaas';
  readonly displayName = 'Asaas';
  readonly supportedMethods: PaymentMethod[] = [
    'PIX',
    'CREDIT_CARD',
    'DEBIT_CARD',
    'BOLETO',
    'PAYMENT_LINK',
  ];

  constructor(private config: AsaasConfig) {}

  private get baseUrl(): string {
    return this.config.environment === 'production'
      ? 'https://api.asaas.com/v3'
      : 'https://sandbox.asaas.com/api/v3';
  }

  async createCharge(input: CreateChargeInput): Promise<ChargeResult> {
    try {
      // Step 1: Ensure customer exists in Asaas
      const customerId = await this.ensureCustomer(
        input.customerName,
        input.customerDocument,
      );

      // Step 2: Create the payment
      const amountInReais = input.amount / 100;

      const dueDate = new Date();
      if (input.expiresInMinutes) {
        dueDate.setMinutes(dueDate.getMinutes() + input.expiresInMinutes);
      } else {
        dueDate.setDate(dueDate.getDate() + 1); // Default: 1 day
      }

      const billingType = METHOD_TO_BILLING_TYPE[input.method] || 'UNDEFINED';

      const body: Record<string, unknown> = {
        customer: customerId,
        billingType,
        value: amountInReais,
        dueDate: dueDate.toISOString().split('T')[0],
        description: input.description || `Pedido ${input.orderNumber}`,
        externalReference: input.orderId,
      };

      if (input.installments && input.installments > 1) {
        body.installmentCount = input.installments;
        body.installmentValue = amountInReais / input.installments;
      }

      const data = await this.request('POST', '/payments', body);

      const chargeId = data.id as string;

      const result: ChargeResult = {
        chargeId,
        status: 'PENDING',
        rawResponse: data,
      };

      // PIX-specific fields
      if (input.method === 'PIX') {
        // Asaas returns PIX data in the payment response or via a separate endpoint
        const pixData = await this.getPixQrCode(chargeId);
        result.qrCode = pixData.payload || undefined;
        result.qrCodeImage = pixData.encodedImage || undefined;
      }

      // Boleto-specific fields
      if (input.method === 'BOLETO') {
        result.boletoUrl = (data.bankSlipUrl as string) || undefined;
        result.boletoBarcode =
          (data.nossoNumero as string) ||
          (data.identificationField as string) ||
          undefined;
      }

      // Checkout URL (works for all methods)
      if (data.invoiceUrl) {
        result.checkoutUrl = data.invoiceUrl as string;
      }

      if (input.expiresInMinutes) {
        result.expiresAt = dueDate;
      }

      console.log(
        `[Asaas] Charge created: ${chargeId} for order ${input.orderNumber} (${billingType})`,
      );

      return result;
    } catch (error) {
      console.error('[Asaas] createCharge error:', error);
      throw new Error(
        `Falha ao criar cobrança via Asaas: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      );
    }
  }

  async checkStatus(chargeId: string): Promise<ChargeStatus> {
    try {
      const data = await this.request('GET', `/payments/${chargeId}`);

      const providerStatus = (data.status as string) || '';

      return {
        status: this.mapStatus(providerStatus),
        paidAt: data.confirmedDate
          ? new Date(data.confirmedDate as string)
          : data.paymentDate
            ? new Date(data.paymentDate as string)
            : undefined,
        paidAmount: data.netValue
          ? Math.round(Number(data.netValue) * 100)
          : data.value
            ? Math.round(Number(data.value) * 100)
            : undefined,
      };
    } catch (error) {
      console.error('[Asaas] checkStatus error:', error);
      throw new Error(
        `Falha ao verificar status via Asaas: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      );
    }
  }

  async handleWebhook(
    payload: unknown,
    _headers: Record<string, string>,
  ): Promise<WebhookResult> {
    try {
      const data = payload as Record<string, unknown>;

      // Asaas webhook format: { event: "PAYMENT_RECEIVED", payment: { id, status, ... } }
      // TODO: Validate webhook token when Asaas provides signature mechanism
      // const webhookToken = headers['asaas-access-token']

      const event = data.event as string;
      const payment = (data.payment as Record<string, unknown>) || data;

      const chargeId =
        (payment.id as string) || (payment.externalReference as string) || '';
      const providerStatus =
        (payment.status as string) || this.eventToStatus(event);
      const paidAmount = payment.netValue
        ? Math.round(Number(payment.netValue) * 100)
        : payment.value
          ? Math.round(Number(payment.value) * 100)
          : undefined;

      const status = this.mapWebhookStatus(providerStatus);

      console.log(
        `[Asaas] Webhook received: event=${event} charge=${chargeId} status=${providerStatus} → ${status}`,
      );

      return {
        chargeId,
        status,
        paidAmount,
        metadata: {
          event,
          billingType: payment.billingType,
          confirmedDate: payment.confirmedDate,
          rawStatus: providerStatus,
        },
      };
    } catch (error) {
      console.error('[Asaas] handleWebhook error:', error);
      throw new Error(
        `Falha ao processar webhook Asaas: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      );
    }
  }

  async testConnection(): Promise<{ ok: boolean; message: string }> {
    try {
      const data = await this.request('GET', '/myAccount');

      const companyName =
        (data.name as string) || (data.company as string) || '';
      const env =
        this.config.environment === 'production' ? 'Produção' : 'Sandbox';

      return {
        ok: true,
        message: `Conectado com sucesso ao Asaas (${env}).${companyName ? ` Conta: ${companyName}` : ''}`,
      };
    } catch (error) {
      return {
        ok: false,
        message: `Falha na conexão: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      };
    }
  }

  getConfigFields(): ConfigField[] {
    return [
      {
        key: 'apiKey',
        label: 'API Key',
        type: 'password',
        required: true,
        placeholder: 'Encontre em Configurações > Integrações',
        helpText:
          'Chave de API do Asaas. Use a chave de sandbox para testes e a de produção para cobranças reais.',
      },
      {
        key: 'environment',
        label: 'Ambiente',
        type: 'text',
        required: true,
        placeholder: 'sandbox',
        helpText:
          'Use "sandbox" para testes ou "production" para cobranças reais. Recomendado testar em sandbox primeiro.',
      },
    ];
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Ensure customer exists in Asaas. Searches by CPF/CNPJ first,
   * creates if not found. Returns the Asaas customer ID.
   */
  private async ensureCustomer(
    name?: string,
    document?: string,
  ): Promise<string> {
    const cleanDocument = document?.replace(/\D/g, '');

    // Try to find existing customer by document
    if (cleanDocument) {
      try {
        const searchResult = await this.request(
          'GET',
          `/customers?cpfCnpj=${cleanDocument}`,
        );

        const customers = searchResult.data as
          | Array<Record<string, unknown>>
          | undefined;
        if (customers && customers.length > 0) {
          return customers[0].id as string;
        }
      } catch {
        // Customer not found, will create below
      }
    }

    // Create new customer
    const customerBody: Record<string, unknown> = {
      name: name || 'Cliente',
    };

    if (cleanDocument) {
      customerBody.cpfCnpj = cleanDocument;
    }

    const created = await this.request('POST', '/customers', customerBody);

    console.log(`[Asaas] Customer created: ${created.id}`);

    return created.id as string;
  }

  /**
   * Get PIX QR Code for a payment.
   * Asaas provides this via GET /payments/{id}/pixQrCode
   */
  private async getPixQrCode(
    paymentId: string,
  ): Promise<{ payload?: string; encodedImage?: string }> {
    try {
      const data = await this.request(
        'GET',
        `/payments/${paymentId}/pixQrCode`,
      );

      return {
        payload: data.payload as string | undefined,
        encodedImage: data.encodedImage as string | undefined,
      };
    } catch (error) {
      console.warn(
        `[Asaas] Could not get PIX QR code for ${paymentId}:`,
        error,
      );
      return {};
    }
  }

  private async request(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<Record<string, unknown>> {
    const requestOptions: RequestInit = {
      method,
      headers: {
        access_token: this.config.apiKey,
        'Content-Type': 'application/json',
      },
    };

    if (body && method !== 'GET') {
      requestOptions.body = JSON.stringify(body);
    }

    const url = `${this.baseUrl}${path}`;

    const httpResponse = await fetch(url, requestOptions);

    if (!httpResponse.ok) {
      const errorBody = await httpResponse.json().catch(() => ({}));
      const errors = (errorBody as Record<string, unknown>).errors as
        | Array<Record<string, unknown>>
        | undefined;
      const errorMessage =
        errors?.[0]?.description || JSON.stringify(errorBody);

      throw new Error(
        `Asaas API error (${httpResponse.status}): ${errorMessage}`,
      );
    }

    const contentLength = httpResponse.headers.get('content-length');
    if (contentLength === '0') {
      return {};
    }

    return httpResponse.json() as Promise<Record<string, unknown>>;
  }

  private mapStatus(providerStatus: string): ChargeStatus['status'] {
    switch (providerStatus) {
      case 'RECEIVED':
      case 'CONFIRMED':
      case 'RECEIVED_IN_CASH':
        return 'PAID';
      case 'OVERDUE':
        return 'EXPIRED';
      case 'REFUNDED':
      case 'REFUND_REQUESTED':
      case 'CHARGEBACK_REQUESTED':
      case 'CHARGEBACK_DISPUTE':
        return 'REFUNDED';
      case 'PENDING':
      case 'AWAITING_RISK_ANALYSIS':
        return 'PENDING';
      default:
        return 'FAILED';
    }
  }

  private mapWebhookStatus(providerStatus: string): WebhookResult['status'] {
    switch (providerStatus) {
      case 'RECEIVED':
      case 'CONFIRMED':
      case 'RECEIVED_IN_CASH':
        return 'PAID';
      case 'OVERDUE':
        return 'EXPIRED';
      case 'REFUNDED':
      case 'REFUND_REQUESTED':
      case 'CHARGEBACK_REQUESTED':
      case 'CHARGEBACK_DISPUTE':
        return 'REFUNDED';
      default:
        return 'FAILED';
    }
  }

  /**
   * Map Asaas webhook event names to status strings.
   */
  private eventToStatus(event: string): string {
    switch (event) {
      case 'PAYMENT_RECEIVED':
      case 'PAYMENT_CONFIRMED':
        return 'RECEIVED';
      case 'PAYMENT_OVERDUE':
        return 'OVERDUE';
      case 'PAYMENT_REFUNDED':
        return 'REFUNDED';
      case 'PAYMENT_DELETED':
      case 'PAYMENT_RESTORED':
      case 'PAYMENT_UPDATED':
        return 'PENDING';
      default:
        return event;
    }
  }
}
