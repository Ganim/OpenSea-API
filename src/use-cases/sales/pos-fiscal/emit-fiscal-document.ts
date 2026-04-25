import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PosFiscalDocumentType } from '@/entities/sales/value-objects/pos-fiscal-document-type';
import { type OrderDTO, orderToDTO } from '@/mappers/sales/order/order-to-dto';
import type { OrdersRepository } from '@/repositories/sales/orders-repository';
import type { PosFiscalConfigsRepository } from '@/repositories/sales/pos-fiscal-configs-repository';
import type { FiscalSefazService } from '@/services/fiscal/fiscal-sefaz-service';
import { queueAuditLog } from '@/workers/queues/audit.queue';

export type EmitFiscalDocumentStatus =
  | 'AUTHORIZED'
  | 'ALREADY_EMITTED'
  | 'SKIPPED'
  | 'REJECTED';

export interface EmitFiscalDocumentRequest {
  tenantId: string;
  orderId: string;
  /**
   * The user/operator id that triggered the emission. Persisted on the audit
   * trail so administrators can correlate emissions with the operator that
   * confirmed the sale at the terminal. May be the device's operator
   * (employee id) when the call originates from a paired terminal — the
   * caller is responsible for picking the right correlation id.
   */
  userId?: string;
}

export interface EmitFiscalDocumentResponse {
  /**
   * High-level outcome of the emission attempt. The frontend uses this to
   * decide whether to show success, "already emitted", a fiscal-disabled
   * banner or the rejection reason.
   */
  status: EmitFiscalDocumentStatus;
  /** The document type the SEFAZ pipeline issued (only on AUTHORIZED). */
  documentType?: PosFiscalDocumentType['value'];
  /** Sequential NF-C-e number used (only on AUTHORIZED / ALREADY_EMITTED). */
  documentNumber?: number;
  /** 44-digit access key (only on AUTHORIZED / ALREADY_EMITTED). */
  accessKey?: string;
  /** SEFAZ authorization protocol (only on AUTHORIZED / ALREADY_EMITTED). */
  authorizationProtocol?: string;
  /** Authorized XML envelope (only on AUTHORIZED — Fase 1 mock returns `<mock/>`). */
  xml?: string;
  /** SEFAZ rejection code (only on REJECTED). */
  errorCode?: string;
  /** SEFAZ rejection message (only on REJECTED). */
  errorMessage?: string;
  /**
   * Human-readable reason for the SKIPPED outcome — e.g. "fiscal disabled".
   * Populated only when `status === 'SKIPPED'`.
   */
  reason?: string;
  /** Snapshot of the Order with the fiscal columns populated (when applicable). */
  order?: OrderDTO;
}

/**
 * Emits an NFC-e for a confirmed Order (Emporion Plan A — Task 32).
 *
 * Fase 1 scope:
 *  - Only `defaultDocumentType = NFC_E` + `emissionMode = ONLINE_SYNC` is
 *    supported. Tenants on `OFFLINE_CONTINGENCY` can configure their fiscal
 *    setup but the actual transmission lives in Fase 2 (the device pipeline
 *    stamps the documents locally and re-syncs later).
 *  - The transport layer is wired through the {@link FiscalSefazService}
 *    interface — the live implementation in Fase 1 is
 *    `MockedFiscalSefazService`, which always authorizes. A real provider
 *    can drop in by implementing the same interface.
 *
 * Idempotency:
 *  - When the Order already carries `fiscalEmittedAt` the use case
 *    short-circuits with `ALREADY_EMITTED`, returning the previously
 *    persisted authorization metadata. This keeps retries from the device
 *    safe (the device may resend the emit request after a network blip).
 *
 * Audit:
 *  - On AUTHORIZED only — emits a `POS_FISCAL_EMIT` audit entry tagged with
 *    the order id, document number and access key so the audit trail keeps
 *    a record of every successful transmission.
 */
export class EmitFiscalDocumentUseCase {
  constructor(
    private ordersRepository: OrdersRepository,
    private posFiscalConfigsRepository: PosFiscalConfigsRepository,
    private fiscalSefazService: FiscalSefazService,
  ) {}

  async execute(
    request: EmitFiscalDocumentRequest,
  ): Promise<EmitFiscalDocumentResponse> {
    const order = await this.ordersRepository.findById(
      new UniqueEntityID(request.orderId),
      request.tenantId,
    );
    if (!order) {
      throw new ResourceNotFoundError(
        `Order ${request.orderId} not found for tenant.`,
      );
    }

    // Idempotency: an Order already stamped with `fiscalEmittedAt` is a
    // resync from the device — return the persisted authorization data so
    // the caller can surface it without re-hitting SEFAZ.
    if (order.fiscalEmittedAt) {
      return {
        status: 'ALREADY_EMITTED',
        documentType: order.fiscalDocumentType?.value,
        documentNumber: order.fiscalDocumentNumber ?? undefined,
        accessKey: order.fiscalAccessKey ?? undefined,
        authorizationProtocol: order.fiscalAuthorizationProtocol ?? undefined,
        order: orderToDTO(order),
      };
    }

    const fiscalConfig = await this.posFiscalConfigsRepository.findByTenantId(
      request.tenantId,
    );
    if (!fiscalConfig) {
      throw new ResourceNotFoundError(
        `Fiscal configuration not found for tenant ${request.tenantId}. Configure the tenant fiscal subsystem before emitting.`,
      );
    }

    if (fiscalConfig.emissionMode.isNone) {
      // Fiscal disabled at the tenant level — return SKIPPED so the caller
      // understands the omission is *expected* and not an error condition.
      return {
        status: 'SKIPPED',
        reason:
          'Fiscal emission is disabled for this tenant (emissionMode=NONE).',
      };
    }

    if (!fiscalConfig.defaultDocumentType.isNfcE) {
      // Fase 1 only ships the NFC-e online flow. NFE / SAT_CFE / MFE land
      // in later phases via additional FiscalSefazService methods.
      throw new BadRequestError(
        `Fiscal emission for ${fiscalConfig.defaultDocumentType.value} is not yet supported. Fase 1 supports only NFC_E.`,
      );
    }

    if (!fiscalConfig.emissionMode.isOnlineSync) {
      // OFFLINE_CONTINGENCY is reserved for the device pipeline — the
      // backend admin endpoint never produces contingency envelopes.
      throw new BadRequestError(
        `Fiscal emission via ${fiscalConfig.emissionMode.value} is not supported by this endpoint. Use the device pipeline for offline contingency.`,
      );
    }

    // Reserve the document number atomically. This must come *before* the
    // SEFAZ call so we never authorize a document we cannot back with a
    // valid sequential. If SEFAZ rejects we keep the increment (a "burnt"
    // number) — that matches Brazilian fiscal practice: rejected NFC-e
    // numbers are voided via inutilização, never reused.
    const documentNumber =
      await this.posFiscalConfigsRepository.incrementNfceNumber(
        request.tenantId,
      );

    const emissionResult = await this.fiscalSefazService.emitNfce({
      order,
      fiscalConfig,
      documentNumber,
    });

    if (emissionResult.status === 'REJECTED') {
      // Persist the REJECTED status on the Order so the operator can see
      // why the sale could not be invoiced. The other fiscal columns stay
      // null — there is nothing to record from a rejected transmission.
      order.fiscalEmissionStatus = 'REJECTED';
      await this.ordersRepository.save(order);

      return {
        status: 'REJECTED',
        errorCode: emissionResult.errorCode,
        errorMessage: emissionResult.errorMessage,
        order: orderToDTO(order),
      };
    }

    // AUTHORIZED — stamp the Order with the SEFAZ outputs.
    order.fiscalDocumentType = PosFiscalDocumentType.create(
      emissionResult.documentType,
    );
    order.fiscalDocumentNumber = emissionResult.documentNumber;
    order.fiscalAccessKey = emissionResult.accessKey;
    order.fiscalAuthorizationProtocol = emissionResult.authorizationProtocol;
    order.fiscalEmittedAt = new Date();
    order.fiscalEmissionStatus = 'AUTHORIZED';

    await this.ordersRepository.save(order);

    queueAuditLog({
      userId: request.userId,
      action: 'POS_FISCAL_EMIT',
      entity: 'ORDER',
      entityId: order.id.toString(),
      module: 'SALES',
      description: `Fiscal document ${emissionResult.documentType} #${emissionResult.documentNumber} emitted for order ${order.orderNumber} (key: ${emissionResult.accessKey})`,
      newData: {
        tenantId: request.tenantId,
        orderId: order.id.toString(),
        orderNumber: order.orderNumber,
        documentType: emissionResult.documentType,
        documentNumber: emissionResult.documentNumber,
        accessKey: emissionResult.accessKey,
        authorizationProtocol: emissionResult.authorizationProtocol,
      },
    }).catch(() => {});

    return {
      status: 'AUTHORIZED',
      documentType: emissionResult.documentType,
      documentNumber: emissionResult.documentNumber,
      accessKey: emissionResult.accessKey,
      authorizationProtocol: emissionResult.authorizationProtocol,
      xml: emissionResult.xml,
      order: orderToDTO(order),
    };
  }
}
