import { Entity } from '../domain/entities';
import type { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export type FinanceApprovalAction = 'AUTO_PAY' | 'AUTO_APPROVE' | 'FLAG_REVIEW';

export interface FinanceApprovalRuleConditions {
  categoryIds?: string[];
  supplierNames?: string[];
  entryType?: 'PAYABLE' | 'RECEIVABLE';
  minRecurrence?: number;
}

export interface FinanceApprovalRuleProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  name: string;
  isActive: boolean;
  action: FinanceApprovalAction;
  maxAmount?: number;
  conditions: FinanceApprovalRuleConditions;
  priority: number;
  appliedCount: number;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export class FinanceApprovalRule extends Entity<FinanceApprovalRuleProps> {
  get id(): UniqueEntityID {
    return this.props.id;
  }
  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get name(): string {
    return this.props.name;
  }
  set name(value: string) {
    this.props.name = value;
    this.touch();
  }

  get isActive(): boolean {
    return this.props.isActive;
  }
  set isActive(value: boolean) {
    this.props.isActive = value;
    this.touch();
  }

  get action(): FinanceApprovalAction {
    return this.props.action;
  }
  set action(value: FinanceApprovalAction) {
    this.props.action = value;
    this.touch();
  }

  get maxAmount(): number | undefined {
    return this.props.maxAmount;
  }
  set maxAmount(value: number | undefined) {
    this.props.maxAmount = value;
    this.touch();
  }

  get conditions(): FinanceApprovalRuleConditions {
    return this.props.conditions;
  }
  set conditions(value: FinanceApprovalRuleConditions) {
    this.props.conditions = value;
    this.touch();
  }

  get priority(): number {
    return this.props.priority;
  }
  set priority(value: number) {
    this.props.priority = value;
    this.touch();
  }

  get appliedCount(): number {
    return this.props.appliedCount;
  }
  set appliedCount(value: number) {
    this.props.appliedCount = value;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date | undefined {
    return this.props.updatedAt;
  }
  get deletedAt(): Date | undefined {
    return this.props.deletedAt;
  }

  activate(): void {
    this.isActive = true;
  }
  deactivate(): void {
    this.isActive = false;
  }

  incrementAppliedCount(): void {
    this.appliedCount = this.appliedCount + 1;
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  static create(
    props: Optional<
      FinanceApprovalRuleProps,
      | 'id'
      | 'createdAt'
      | 'updatedAt'
      | 'deletedAt'
      | 'isActive'
      | 'priority'
      | 'appliedCount'
      | 'conditions'
    >,
    id?: UniqueEntityID,
  ): FinanceApprovalRule {
    return new FinanceApprovalRule(
      {
        ...props,
        id: id ?? new UniqueEntityID(),
        isActive: props.isActive ?? true,
        priority: props.priority ?? 0,
        appliedCount: props.appliedCount ?? 0,
        conditions: props.conditions ?? {},
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt,
        deletedAt: props.deletedAt,
      },
      id,
    );
  }
}
