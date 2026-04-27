/**
 * RegenerateWebhookSecretUseCase — Phase 11 / Plan 11-02 / D-07, D-08.
 *
 * Rotação suave 7d:
 *   - secretPrevious = oldSecretCurrent
 *   - secretPreviousExpiresAt = NOW + 7d
 *   - secretCurrent = generateWebhookSecret()
 *   - secretCurrentLast4 = last4 do novo
 * Retorna cleartext UMA VEZ (D-08).
 */
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import {
  webhookEndpointToDto,
  type WebhookEndpointDTO,
} from '@/mappers/system/webhook-endpoint/webhook-endpoint-to-dto';
import {
  generateWebhookSecret,
  getSecretLast4,
} from '@/modules/system/webhooks/lib/hmac-sign';
import type { WebhookEndpointsRepository } from '@/repositories/system/webhook-endpoints-repository';

const ROTATION_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export interface RegenerateWebhookSecretRequest {
  id: string;
  tenantId: string;
}

export interface RegenerateWebhookSecretResponse {
  endpoint: WebhookEndpointDTO;
  /** Cleartext — UMA VEZ */
  secret: string;
}

export class RegenerateWebhookSecretUseCase {
  constructor(private repo: WebhookEndpointsRepository) {}

  async execute(
    input: RegenerateWebhookSecretRequest,
  ): Promise<RegenerateWebhookSecretResponse> {
    const endpoint = await this.repo.findById(input.id, input.tenantId);
    if (!endpoint) {
      throw new ResourceNotFoundError('Webhook não encontrado');
    }

    const newSecret = generateWebhookSecret();
    const newLast4 = getSecretLast4(newSecret);
    const now = new Date();

    await this.repo.update(input.id, input.tenantId, {
      secretCurrent: newSecret,
      secretCurrentLast4: newLast4,
      secretCurrentCreatedAt: now,
      secretPrevious: endpoint.secretCurrent,
      secretPreviousExpiresAt: new Date(now.getTime() + ROTATION_WINDOW_MS),
    });

    const updated = await this.repo.findById(input.id, input.tenantId);
    if (!updated) {
      throw new ResourceNotFoundError('Webhook não encontrado após rotação');
    }

    return {
      endpoint: webhookEndpointToDto(updated),
      secret: newSecret,
    };
  }
}
