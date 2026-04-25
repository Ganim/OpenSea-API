import { Entity } from '../domain/entities';
import type { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

import { PosOrderConflictStatus } from './value-objects/pos-order-conflict-status';

export interface ConflictDetail {
  itemId: string;
  variantId: string;
  requestedQuantity: number;
  availableQuantity: number;
  shortage: number;
  reason:
    | 'INSUFFICIENT_STOCK'
    | 'FRACTIONAL_NOT_ALLOWED'
    | 'BELOW_MIN_FRACTIONAL_SALE'
    | 'ITEM_NOT_FOUND';
}

/**
 * One line of the original cart, snapshot when the conflict was created.
 * Persisted on `PosOrderConflict.originalCart` so the manual-resolution
 * endpoint (Emporion Plan A — Task 31) can re-create the Order on
 * FORCE_ADJUSTMENT and SUBSTITUTE_ITEM without asking the terminal to replay
 * the sale.
 */
export interface OriginalCartLine {
  itemId: string;
  variantId: string;
  name: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  discountValue?: number;
}

/**
 * One payment leg snapshot, persisted on `PosOrderConflict.originalPayments`.
 * Mirrors the wire shape of `CreateSaleFromTerminalPayment`.
 */
export interface OriginalPayment {
  method: string;
  amount: number;
  reference?: string | null;
}

/**
 * Customer data snapshot captured at sale time, persisted on
 * `PosOrderConflict.originalCustomerData`. Mirrors the discriminated union of
 * `CreateSaleFromTerminalCustomerData`.
 */
export type OriginalCustomerData =
  | { kind: 'EXISTING'; customerId: string }
  | { kind: 'CPF_ONLY'; cpf: string }
  | { kind: 'ANONYMOUS' };

export interface PosOrderConflictProps {
  tenantId: string;
  saleLocalUuid: string;
  orderId: string | null;
  posTerminalId: string;
  posSessionId: string | null;
  posOperatorEmployeeId: string | null;
  status: PosOrderConflictStatus;
  conflictDetails: ConflictDetail[];
  resolutionDetails: Record<string, unknown> | null;
  resolvedByUserId: string | null;
  resolvedAt: Date | null;
  /**
   * Snapshot of the cart that produced the conflict. Optional for conflicts
   * created before Task 31's migration (legacy rows have `null`).
   */
  originalCart: OriginalCartLine[] | null;
  /**
   * Snapshot of the payment legs collected at the till. Optional for legacy
   * conflicts.
   */
  originalPayments: OriginalPayment[] | null;
  /**
   * Snapshot of the customer classification (EXISTING / CPF_ONLY / ANONYMOUS).
   * Optional for legacy conflicts.
   */
  originalCustomerData: OriginalCustomerData | null;
  createdAt: Date;
  updatedAt?: Date;
}

export class PosOrderConflict extends Entity<PosOrderConflictProps> {
  get tenantId(): string {
    return this.props.tenantId;
  }

  get saleLocalUuid(): string {
    return this.props.saleLocalUuid;
  }

  get orderId(): string | null {
    return this.props.orderId;
  }

  get posTerminalId(): string {
    return this.props.posTerminalId;
  }

  get posSessionId(): string | null {
    return this.props.posSessionId;
  }

  get posOperatorEmployeeId(): string | null {
    return this.props.posOperatorEmployeeId;
  }

  get status(): PosOrderConflictStatus {
    return this.props.status;
  }

  get conflictDetails(): ConflictDetail[] {
    return this.props.conflictDetails;
  }

  get resolutionDetails(): Record<string, unknown> | null {
    return this.props.resolutionDetails;
  }

  get resolvedByUserId(): string | null {
    return this.props.resolvedByUserId;
  }

  get resolvedAt(): Date | null {
    return this.props.resolvedAt;
  }

  get originalCart(): OriginalCartLine[] | null {
    return this.props.originalCart;
  }

  get originalPayments(): OriginalPayment[] | null {
    return this.props.originalPayments;
  }

  get originalCustomerData(): OriginalCustomerData | null {
    return this.props.originalCustomerData;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date | undefined {
    return this.props.updatedAt;
  }

  private touch() {
    this.props.updatedAt = new Date();
  }

  public resolve(
    newStatus: PosOrderConflictStatus,
    userId: string,
    details: Record<string, unknown>,
  ): void {
    this.props.status = newStatus;
    this.props.resolvedByUserId = userId;
    this.props.resolvedAt = new Date();
    this.props.resolutionDetails = details;
    this.touch();
  }

  /**
   * Attaches the Order produced by a manual resolution (Emporion Plan A —
   * Task 31). Used by `ResolveConflictManuallyUseCase` for all three resolution
   * actions so the conflict row keeps a back-reference to the Order — useful
   * for downstream debugging and audit reconciliation.
   */
  public linkOrder(orderId: string): void {
    this.props.orderId = orderId;
    this.touch();
  }

  public static create(
    props: Optional<
      PosOrderConflictProps,
      | 'status'
      | 'orderId'
      | 'posSessionId'
      | 'posOperatorEmployeeId'
      | 'resolutionDetails'
      | 'resolvedByUserId'
      | 'resolvedAt'
      | 'originalCart'
      | 'originalPayments'
      | 'originalCustomerData'
      | 'createdAt'
      | 'updatedAt'
    >,
    id?: UniqueEntityID,
  ): PosOrderConflict {
    return new PosOrderConflict(
      {
        tenantId: props.tenantId,
        saleLocalUuid: props.saleLocalUuid,
        orderId: props.orderId ?? null,
        posTerminalId: props.posTerminalId,
        posSessionId: props.posSessionId ?? null,
        posOperatorEmployeeId: props.posOperatorEmployeeId ?? null,
        status: props.status ?? PosOrderConflictStatus.PENDING_RESOLUTION(),
        conflictDetails: props.conflictDetails,
        resolutionDetails: props.resolutionDetails ?? null,
        resolvedByUserId: props.resolvedByUserId ?? null,
        resolvedAt: props.resolvedAt ?? null,
        originalCart: props.originalCart ?? null,
        originalPayments: props.originalPayments ?? null,
        originalCustomerData: props.originalCustomerData ?? null,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt,
      },
      id,
    );
  }
}
