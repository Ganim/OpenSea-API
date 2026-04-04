/**
 * Manual payment provider (default — always available).
 *
 * Used for: cash, physical card machine, external PIX, bank transfer,
 * check, or any payment registered manually by the operator.
 *
 * All charges are immediately marked as PAID.
 */

import { randomUUID } from 'node:crypto'

import type {
  PaymentProvider,
  PaymentMethod,
  CreateChargeInput,
  ChargeResult,
  ChargeStatus,
  WebhookResult,
  ConfigField,
} from '../payment-provider.interface'

export class ManualProvider implements PaymentProvider {
  readonly name = 'manual'
  readonly displayName = 'Manual'
  readonly supportedMethods: PaymentMethod[] = [
    'PIX',
    'CREDIT_CARD',
    'DEBIT_CARD',
    'BOLETO',
    'PAYMENT_LINK',
  ]

  async createCharge(input: CreateChargeInput): Promise<ChargeResult> {
    return {
      chargeId: randomUUID(),
      status: 'PAID',
      rawResponse: { manual: true, amount: input.amount },
    }
  }

  async checkStatus(_chargeId: string): Promise<ChargeStatus> {
    return {
      status: 'PAID',
      paidAt: new Date(),
    }
  }

  async handleWebhook(
    _payload: unknown,
    _headers: Record<string, string>,
  ): Promise<WebhookResult> {
    // Manual provider does not receive webhooks
    throw new Error('ManualProvider does not support webhooks')
  }

  async testConnection(): Promise<{ ok: boolean; message: string }> {
    return {
      ok: true,
      message: 'Pagamento manual não requer configuração.',
    }
  }

  getConfigFields(): ConfigField[] {
    return []
  }
}
