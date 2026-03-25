import type {
  CreatePixChargeParams,
  PixChargeResult,
  PixProvider,
  PixWebhookEvent,
} from './pix-provider.interface';

/**
 * Efi (Gerencianet) PIX provider stub.
 *
 * Base URL: https://pix.api.efipay.com.br
 * Auth: OAuth2 with certificate mTLS
 *
 * Endpoints:
 * - POST /v2/cob/{txid}   — create immediate charge
 * - PATCH /v2/cob/{txid}  — update charge (e.g. cancel)
 * - GET /v2/cob/{txid}    — query charge status
 * - POST /v2/webhook/{chave} — register webhook URL
 */
export class EfiPixProvider implements PixProvider {
  readonly providerName = 'EFI';

  async createCharge(params: CreatePixChargeParams): Promise<PixChargeResult> {
    // TODO: Implement Efi API call
    // POST https://pix.api.efipay.com.br/v2/cob/{txid}
    // Body: { calendario: { expiracao: params.expirationSeconds }, devedor: { cpf/cnpj, nome }, valor: { original }, solicitacaoPagador: params.description }
    // Response: { txid, location, pixCopiaECola, ... }
    throw new Error(
      `EfiPixProvider.createCharge not implemented. txId=${params.txId}`,
    );
  }

  async cancelCharge(txId: string): Promise<void> {
    // TODO: Implement Efi API call
    // PATCH https://pix.api.efipay.com.br/v2/cob/{txid}
    // Body: { status: 'REMOVIDA_PELO_USUARIO_RECEBEDOR' }
    throw new Error(
      `EfiPixProvider.cancelCharge not implemented. txId=${txId}`,
    );
  }

  async queryCharge(txId: string): Promise<{ status: string; paidAt?: Date }> {
    // TODO: Implement Efi API call
    // GET https://pix.api.efipay.com.br/v2/cob/{txid}
    // Response: { status: 'ATIVA'|'CONCLUIDA'|'REMOVIDA_PELO_USUARIO_RECEBEDOR'|'REMOVIDA_PELO_PSP', pix: [{ horario, ... }] }
    throw new Error(`EfiPixProvider.queryCharge not implemented. txId=${txId}`);
  }

  async parseWebhook(payload: unknown): Promise<PixWebhookEvent> {
    // TODO: Implement Efi webhook payload parsing
    // Efi sends: { pix: [{ txid, endToEndId, horario, valor, pagador: { cpf, nome } }] }
    throw new Error(
      `EfiPixProvider.parseWebhook not implemented. payload=${JSON.stringify(payload)}`,
    );
  }

  verifyWebhook(_payload: unknown, _signature: string): boolean {
    // TODO: Implement mTLS certificate validation for Efi webhooks
    // Efi uses mTLS (client certificate) for webhook authentication
    return false;
  }
}
