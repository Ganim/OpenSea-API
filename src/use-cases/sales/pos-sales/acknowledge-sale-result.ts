import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { OrdersRepository } from '@/repositories/sales/orders-repository';

export interface AcknowledgeSaleResultRequest {
  tenantId: string;
  saleLocalUuid: string;
}

export interface AcknowledgeSaleResultResponse {
  success: true;
  ackedAt: Date;
}

/**
 * Records the POS terminal's confirmation that it received and processed the
 * API response for a previously synchronized sale (Emporion Plan A —
 * Task 29). The terminal calls this endpoint right after it has acted on
 * the result of `POST /v1/pos/sales` so that, even when the original
 * response was lost mid-flight, the API has a durable signal that the
 * terminal is no longer holding the sale in its local outbox.
 *
 * Behavior:
 *  - Looks up the Order by `(saleLocalUuid, tenantId)` (soft-deleted Orders
 *    excluded). The pair is the canonical idempotency key for the
 *    sync-create endpoint, so it uniquely identifies the sale we want to ack.
 *  - On miss, throws {@link ResourceNotFoundError} so the controller can
 *    return 404. The terminal interprets that as "the API never knew about
 *    this sale" and surfaces a recovery flow.
 *  - On hit, delegates to `Order.markAcknowledged()` which is idempotent:
 *    the first call stamps `ackReceivedAt = now`, subsequent calls are
 *    no-ops. The persisted (or pre-existing) timestamp is returned to the
 *    caller in both branches, so the terminal can decide whether the call
 *    flipped the flag or merely re-confirmed it.
 *  - No audit log is emitted — the ack is purely a delivery-confirmation
 *    signal and does not change business-relevant state of the Order.
 *
 * The controller is device-authenticated (no JWT/RBAC) and shares the
 * `verifyDeviceToken` middleware with Tasks 26-28; tenant isolation is
 * enforced by passing `device.tenantId` from the verified pairing context.
 */
export class AcknowledgeSaleResultUseCase {
  constructor(private ordersRepository: OrdersRepository) {}

  async execute(
    request: AcknowledgeSaleResultRequest,
  ): Promise<AcknowledgeSaleResultResponse> {
    const order = await this.ordersRepository.findBySaleLocalUuid(
      request.saleLocalUuid,
      request.tenantId,
    );

    if (!order) {
      throw new ResourceNotFoundError(
        `No POS sale found for saleLocalUuid '${request.saleLocalUuid}'.`,
      );
    }

    if (order.ackReceivedAt) {
      return {
        success: true,
        ackedAt: order.ackReceivedAt,
      };
    }

    order.markAcknowledged();
    await this.ordersRepository.save(order);

    // `markAcknowledged()` guarantees `ackReceivedAt` is non-null after the
    // call when the entry path was unack'd. The non-null assertion below is
    // safe and lets the response type stay `Date` (not `Date | null`) so the
    // controller can serialize without a runtime guard.
    return {
      success: true,
      ackedAt: order.ackReceivedAt as Date,
    };
  }
}
