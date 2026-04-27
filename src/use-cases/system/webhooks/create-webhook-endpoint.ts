/**
 * CreateWebhookEndpointUseCase — Phase 11 / Plan 11-02 / D-08, D-31, D-34.
 *
 * Cria webhook outbound tenant-scoped:
 *   - Anti-SSRF (D-31): valida URL via validateWebhookUrlOrThrow
 *   - Cap 50/tenant (D-34): rejeita se tenant atingiu limite
 *   - Allowlist (D-16): cada subscribedEvent deve estar em WEBHOOK_EVENT_ALLOWLIST
 *   - Secret one-time-revealed (D-08): retorna cleartext UMA VEZ
 */
import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { WebhookEndpoint } from '@/entities/system/webhook-endpoint';
import { WEBHOOK_EVENT_ALLOWLIST } from '@/lib/events/webhook-events';
import {
  webhookEndpointToDto,
  type WebhookEndpointDTO,
} from '@/mappers/system/webhook-endpoint/webhook-endpoint-to-dto';
import {
  generateWebhookSecret,
  getSecretLast4,
} from '@/modules/system/webhooks/lib/hmac-sign';
import { validateWebhookUrlOrThrow } from '@/modules/system/webhooks/lib/anti-ssrf';
import type { WebhookEndpointsRepository } from '@/repositories/system/webhook-endpoints-repository';

export const TENANT_WEBHOOK_CAP = 50;

export interface CreateWebhookEndpointRequest {
  tenantId: string;
  url: string;
  description?: string | null;
  subscribedEvents: string[];
  apiVersion?: string;
}

export interface CreateWebhookEndpointResponse {
  endpoint: WebhookEndpointDTO;
  /** Cleartext — retornado UMA VEZ (D-08) */
  secret: string;
}

export class TenantWebhookCapReachedError extends BadRequestError {
  constructor() {
    super(
      `Tenant atingiu o limite de ${TENANT_WEBHOOK_CAP} webhooks ativos. Exclua um webhook existente antes de criar outro.`,
    );
  }
}

export class CreateWebhookEndpointUseCase {
  constructor(private repo: WebhookEndpointsRepository) {}

  async execute(
    input: CreateWebhookEndpointRequest,
  ): Promise<CreateWebhookEndpointResponse> {
    if (!input.url || typeof input.url !== 'string') {
      throw new BadRequestError('URL é obrigatória');
    }
    if (input.url.length > 2048) {
      throw new BadRequestError('URL excede 2048 caracteres');
    }
    if (
      !Array.isArray(input.subscribedEvents) ||
      input.subscribedEvents.length === 0
    ) {
      throw new BadRequestError(
        'subscribedEvents é obrigatório (mínimo 1 evento)',
      );
    }
    for (const evt of input.subscribedEvents) {
      if (!WEBHOOK_EVENT_ALLOWLIST.includes(evt as never)) {
        throw new BadRequestError(
          `Evento "${evt}" não está na allowlist de webhooks (D-16)`,
        );
      }
    }
    if (input.description && input.description.length > 200) {
      throw new BadRequestError('description excede 200 caracteres');
    }

    // D-31 anti-SSRF — pode lançar
    await validateWebhookUrlOrThrow(input.url);

    // D-34 cap 50/tenant
    const activeCount = await this.repo.countActiveByTenant(input.tenantId);
    if (activeCount >= TENANT_WEBHOOK_CAP) {
      throw new TenantWebhookCapReachedError();
    }

    // D-08 secret cleartext UMA VEZ
    const secret = generateWebhookSecret();
    const last4 = getSecretLast4(secret);
    const now = new Date();

    const endpoint = WebhookEndpoint.create({
      tenantId: new UniqueEntityID(input.tenantId),
      url: input.url,
      description: input.description ?? null,
      apiVersion: input.apiVersion ?? '2026-04-27',
      subscribedEvents: input.subscribedEvents,
      secretCurrent: secret,
      secretCurrentLast4: last4,
      secretCurrentCreatedAt: now,
    });

    await this.repo.create(endpoint);

    return {
      endpoint: webhookEndpointToDto(endpoint),
      secret,
    };
  }
}
