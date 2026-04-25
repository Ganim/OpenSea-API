import { Entity } from '../domain/entities';
import type { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface PosTerminalOperatorProps {
  terminalId: UniqueEntityID;
  employeeId: UniqueEntityID;
  tenantId: string;
  isActive: boolean;
  assignedAt: Date;
  assignedByUserId: UniqueEntityID;
  revokedAt: Date | null;
  revokedByUserId: UniqueEntityID | null;
}

export class PosTerminalOperator extends Entity<PosTerminalOperatorProps> {
  get terminalId(): UniqueEntityID {
    return this.props.terminalId;
  }

  get employeeId(): UniqueEntityID {
    return this.props.employeeId;
  }

  get tenantId(): string {
    return this.props.tenantId;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get assignedAt(): Date {
    return this.props.assignedAt;
  }

  get assignedByUserId(): UniqueEntityID {
    return this.props.assignedByUserId;
  }

  get revokedAt(): Date | null {
    return this.props.revokedAt;
  }

  get revokedByUserId(): UniqueEntityID | null {
    return this.props.revokedByUserId;
  }

  public revoke(userId: UniqueEntityID): void {
    this.props.isActive = false;
    this.props.revokedAt = new Date();
    this.props.revokedByUserId = userId;
  }

  public static create(
    props: Optional<
      PosTerminalOperatorProps,
      'isActive' | 'assignedAt' | 'revokedAt' | 'revokedByUserId'
    >,
    id?: UniqueEntityID,
  ): PosTerminalOperator {
    return new PosTerminalOperator(
      {
        terminalId: props.terminalId,
        employeeId: props.employeeId,
        tenantId: props.tenantId,
        isActive: props.isActive ?? true,
        assignedAt: props.assignedAt ?? new Date(),
        assignedByUserId: props.assignedByUserId,
        revokedAt: props.revokedAt ?? null,
        revokedByUserId: props.revokedByUserId ?? null,
      },
      id,
    );
  }
}
