import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import {
  webhookEndpointToDto,
  type WebhookEndpointDTO,
} from '@/mappers/system/webhook-endpoint/webhook-endpoint-to-dto';
import type { WebhookEndpointsRepository } from '@/repositories/system/webhook-endpoints-repository';

export interface GetWebhookEndpointRequest {
  id: string;
  tenantId: string;
}

export interface GetWebhookEndpointResponse {
  endpoint: WebhookEndpointDTO;
}

export class GetWebhookEndpointUseCase {
  constructor(private repo: WebhookEndpointsRepository) {}

  async execute(
    input: GetWebhookEndpointRequest,
  ): Promise<GetWebhookEndpointResponse> {
    const endpoint = await this.repo.findById(input.id, input.tenantId);
    if (!endpoint) {
      throw new ResourceNotFoundError('Webhook não encontrado');
    }
    return { endpoint: webhookEndpointToDto(endpoint) };
  }
}
