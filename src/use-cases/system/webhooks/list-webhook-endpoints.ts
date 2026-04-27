/**
 * ListWebhookEndpointsUseCase — Phase 11 / Plan 11-02.
 *
 * Listagem paginada (infinite scroll) com filtros status + search e contadores
 * agregados (active/paused/auto-disabled/total) — UI-SPEC counter chips.
 */
import {
  webhookEndpointToDto,
  type WebhookEndpointDTO,
} from '@/mappers/system/webhook-endpoint/webhook-endpoint-to-dto';
import type { WebhookEndpointsRepository } from '@/repositories/system/webhook-endpoints-repository';
import type { WebhookEndpointStatus } from '@/entities/system/webhook-endpoint';

export interface ListWebhookEndpointsRequest {
  tenantId: string;
  status?: WebhookEndpointStatus;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface ListWebhookEndpointsResponse {
  items: WebhookEndpointDTO[];
  total: number;
  count: {
    active: number;
    paused: number;
    autoDisabled: number;
    total: number;
  };
}

export class ListWebhookEndpointsUseCase {
  constructor(private repo: WebhookEndpointsRepository) {}

  async execute(
    input: ListWebhookEndpointsRequest,
  ): Promise<ListWebhookEndpointsResponse> {
    const limit = Math.min(Math.max(input.limit ?? 20, 1), 100);
    const offset = Math.max(input.offset ?? 0, 0);

    const result = await this.repo.findAll({
      tenantId: input.tenantId,
      status: input.status,
      search: input.search,
      limit,
      offset,
    });

    return {
      items: result.items.map(webhookEndpointToDto),
      total: result.total,
      count: result.count,
    };
  }
}
