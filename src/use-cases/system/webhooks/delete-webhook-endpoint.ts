/**
 * DeleteWebhookEndpointUseCase — Phase 11 / Plan 11-02.
 * Soft-delete via deletedAt; FK onDelete: Cascade trata WebhookDelivery.
 */
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { WebhookEndpointsRepository } from '@/repositories/system/webhook-endpoints-repository';

export interface DeleteWebhookEndpointRequest {
  id: string;
  tenantId: string;
}

export class DeleteWebhookEndpointUseCase {
  constructor(private repo: WebhookEndpointsRepository) {}

  async execute(input: DeleteWebhookEndpointRequest): Promise<void> {
    const endpoint = await this.repo.findById(input.id, input.tenantId);
    if (!endpoint) {
      throw new ResourceNotFoundError('Webhook não encontrado');
    }
    await this.repo.delete(input.id, input.tenantId);
  }
}
