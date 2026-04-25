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
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt,
      },
      id,
    );
  }
}
