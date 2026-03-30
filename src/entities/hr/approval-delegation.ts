import { Entity } from '../domain/entities';
import { UniqueEntityID } from '../domain/unique-entity-id';

export type DelegationScope =
  | 'ALL'
  | 'ABSENCES'
  | 'VACATIONS'
  | 'OVERTIME'
  | 'REQUESTS';

export interface ApprovalDelegationProps {
  tenantId: UniqueEntityID;
  delegatorId: UniqueEntityID;
  delegateId: UniqueEntityID;
  scope: DelegationScope;
  startDate: Date;
  endDate?: Date;
  reason?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class ApprovalDelegation extends Entity<ApprovalDelegationProps> {
  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get delegatorId(): UniqueEntityID {
    return this.props.delegatorId;
  }

  get delegateId(): UniqueEntityID {
    return this.props.delegateId;
  }

  get scope(): DelegationScope {
    return this.props.scope;
  }

  get startDate(): Date {
    return this.props.startDate;
  }

  get endDate(): Date | undefined {
    return this.props.endDate;
  }

  get reason(): string | undefined {
    return this.props.reason;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  /**
   * Checks if the delegation is currently effective (active, started, and not expired)
   */
  isEffective(referenceDate?: Date): boolean {
    const now = referenceDate ?? new Date();
    if (!this.isActive) return false;
    if (this.startDate > now) return false;
    if (this.endDate && this.endDate < now) return false;
    return true;
  }

  /**
   * Checks if this delegation covers a specific scope
   */
  coversScope(targetScope: DelegationScope): boolean {
    return this.scope === 'ALL' || this.scope === targetScope;
  }

  /**
   * Checks if the delegation is expired (past endDate)
   */
  isExpired(referenceDate?: Date): boolean {
    const now = referenceDate ?? new Date();
    return !!this.endDate && this.endDate < now;
  }

  /**
   * Revokes the delegation by setting isActive to false
   */
  revoke(): void {
    if (!this.isActive) {
      throw new Error('Delegation is already revoked');
    }
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  private constructor(props: ApprovalDelegationProps, id?: UniqueEntityID) {
    super(props, id);
  }

  static create(
    props: Omit<ApprovalDelegationProps, 'createdAt' | 'updatedAt' | 'isActive'> & {
      isActive?: boolean;
    },
    id?: UniqueEntityID,
  ): ApprovalDelegation {
    const now = new Date();
    return new ApprovalDelegation(
      {
        ...props,
        isActive: props.isActive ?? true,
        createdAt: now,
        updatedAt: now,
      },
      id,
    );
  }
}
