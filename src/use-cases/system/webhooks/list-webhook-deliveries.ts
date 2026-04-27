/**
 * ListWebhookDeliveriesUseCase — Phase 11 / Plan 11-02 / D-13.
 *
 * 4 filtros: status, periodo (createdAfter/createdBefore), eventType, httpStatus.
 * Infinite scroll com counters agregados por status.
 */
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { WebhookDeliveryStatus } from '@/entities/system/webhook-delivery';
import {
  webhookDeliveryToDto,
  type WebhookDeliveryDTO,
} from '@/mappers/system/webhook-delivery/webhook-delivery-to-dto';
import type { WebhookDeliveriesRepository } from '@/repositories/system/webhook-deliveries-repository';
import type { WebhookEndpointsRepository } from '@/repositories/system/webhook-endpoints-repository';

export interface ListWebhookDeliveriesRequest {
  tenantId: string;
  endpointId: string;
  status?: WebhookDeliveryStatus;
  createdAfter?: Date;
  createdBefore?: Date;
  eventType?: string;
  httpStatus?: number;
  limit?: number;
  offset?: number;
}

export interface ListWebhookDeliveriesResponse {
  items: WebhookDeliveryDTO[];
  total: number;
  count: {
    pending: number;
    delivered: number;
    failed: number;
    dead: number;
    total: number;
  };
}

export class ListWebhookDeliveriesUseCase {
  constructor(
    private endpointsRepo: WebhookEndpointsRepository,
    private deliveriesRepo: WebhookDeliveriesRepository,
  ) {}

  async execute(
    input: ListWebhookDeliveriesRequest,
  ): Promise<ListWebhookDeliveriesResponse> {
    // Verifica endpoint existe e pertence ao tenant (404 cross-tenant)
    const endpoint = await this.endpointsRepo.findById(
      input.endpointId,
      input.tenantId,
    );
    if (!endpoint) {
      throw new ResourceNotFoundError('Webhook não encontrado');
    }

    const limit = Math.min(Math.max(input.limit ?? 20, 1), 100);
    const offset = Math.max(input.offset ?? 0, 0);

    const result = await this.deliveriesRepo.findAll({
      tenantId: input.tenantId,
      endpointId: input.endpointId,
      status: input.status,
      createdAfter: input.createdAfter,
      createdBefore: input.createdBefore,
      eventType: input.eventType,
      httpStatus: input.httpStatus,
      limit,
      offset,
    });

    return {
      items: result.items.map(webhookDeliveryToDto),
      total: result.total,
      count: result.count,
    };
  }
}
