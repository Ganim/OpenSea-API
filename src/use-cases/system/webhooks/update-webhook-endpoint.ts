/**
 * UpdateWebhookEndpointUseCase — Phase 11 / Plan 11-02.
 *
 * NÃO permite alterar URL (UI-SPEC: "Para alterar a URL, exclua e recrie").
 * NÃO permite ir para AUTO_DISABLED via PATCH (apenas worker faz isso).
 * Para reactivate de AUTO_DISABLED, usar reactivate-webhook-endpoint (PIN gate).
 */
import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { WEBHOOK_EVENT_ALLOWLIST } from '@/lib/events/webhook-events';
import {
  webhookEndpointToDto,
  type WebhookEndpointDTO,
} from '@/mappers/system/webhook-endpoint/webhook-endpoint-to-dto';
import type { WebhookEndpointsRepository } from '@/repositories/system/webhook-endpoints-repository';

export interface UpdateWebhookEndpointRequest {
  id: string;
  tenantId: string;
  description?: string | null;
  subscribedEvents?: string[];
  status?: 'ACTIVE' | 'PAUSED';
}

export interface UpdateWebhookEndpointResponse {
  endpoint: WebhookEndpointDTO;
}

export class UpdateWebhookEndpointUseCase {
  constructor(private repo: WebhookEndpointsRepository) {}

  async execute(
    input: UpdateWebhookEndpointRequest,
  ): Promise<UpdateWebhookEndpointResponse> {
    const endpoint = await this.repo.findById(input.id, input.tenantId);
    if (!endpoint) {
      throw new ResourceNotFoundError('Webhook não encontrado');
    }

    if (endpoint.status === 'AUTO_DISABLED') {
      throw new BadRequestError(
        'Webhook AUTO_DISABLED — use o endpoint /reactivate (PIN-gated) para reativar',
      );
    }

    if (input.subscribedEvents !== undefined) {
      if (input.subscribedEvents.length === 0) {
        throw new BadRequestError(
          'subscribedEvents não pode ser vazio (mínimo 1 evento)',
        );
      }
      for (const evt of input.subscribedEvents) {
        if (!WEBHOOK_EVENT_ALLOWLIST.includes(evt as never)) {
          throw new BadRequestError(
            `Evento "${evt}" não está na allowlist de webhooks`,
          );
        }
      }
    }
    if (
      input.description !== undefined &&
      input.description !== null &&
      input.description.length > 200
    ) {
      throw new BadRequestError('description excede 200 caracteres');
    }

    await this.repo.update(input.id, input.tenantId, {
      description: input.description,
      subscribedEvents: input.subscribedEvents,
      status: input.status,
    });

    const updated = await this.repo.findById(input.id, input.tenantId);
    if (!updated) {
      throw new ResourceNotFoundError('Webhook não encontrado após update');
    }
    return { endpoint: webhookEndpointToDto(updated) };
  }
}
