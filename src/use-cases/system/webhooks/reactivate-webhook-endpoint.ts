/**
 * ReactivateWebhookEndpointUseCase — Phase 11 / Plan 11-02 / D-25.
 *
 * Só funciona se status === AUTO_DISABLED. Sets ACTIVE + reseta contadores
 * + nullifies autoDisabledReason/autoDisabledAt. PIN-gated no controller.
 */
import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import {
  webhookEndpointToDto,
  type WebhookEndpointDTO,
} from '@/mappers/system/webhook-endpoint/webhook-endpoint-to-dto';
import type { WebhookEndpointsRepository } from '@/repositories/system/webhook-endpoints-repository';

export interface ReactivateWebhookEndpointRequest {
  id: string;
  tenantId: string;
}

export interface ReactivateWebhookEndpointResponse {
  endpoint: WebhookEndpointDTO;
}

export class ReactivateWebhookEndpointUseCase {
  constructor(private repo: WebhookEndpointsRepository) {}

  async execute(
    input: ReactivateWebhookEndpointRequest,
  ): Promise<ReactivateWebhookEndpointResponse> {
    const endpoint = await this.repo.findById(input.id, input.tenantId);
    if (!endpoint) {
      throw new ResourceNotFoundError('Webhook não encontrado');
    }
    if (endpoint.status !== 'AUTO_DISABLED') {
      throw new BadRequestError(
        `Webhook não está AUTO_DISABLED (status atual: ${endpoint.status})`,
      );
    }

    await this.repo.update(input.id, input.tenantId, {
      status: 'ACTIVE',
      autoDisabledReason: null,
      autoDisabledAt: null,
      consecutiveDeadCount: 0,
    });

    const updated = await this.repo.findById(input.id, input.tenantId);
    if (!updated) {
      throw new ResourceNotFoundError('Webhook não encontrado após reactivate');
    }
    return { endpoint: webhookEndpointToDto(updated) };
  }
}
