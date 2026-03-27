import { Entity } from '../domain/entities';
import type { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export type LeadRoutingStrategy =
  | 'ROUND_ROBIN'
  | 'TERRITORY'
  | 'SEGMENT'
  | 'LOAD_BALANCE';

export interface TerritoryConfig {
  territories: Array<{
    userId: string;
    states?: string[];
    cities?: string[];
  }>;
}

export interface SegmentConfig {
  segments: Array<{
    userId: string;
    customerTypes?: string[];
    tags?: string[];
  }>;
}

export interface LeadRoutingRuleProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  name: string;
  strategy: LeadRoutingStrategy;
  config: Record<string, unknown>;
  assignToUsers: string[];
  maxLeadsPerUser?: number;
  lastAssignedIndex: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class LeadRoutingRule extends Entity<LeadRoutingRuleProps> {
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

  get strategy(): LeadRoutingStrategy {
    return this.props.strategy;
  }

  set strategy(value: LeadRoutingStrategy) {
    this.props.strategy = value;
    this.touch();
  }

  get config(): Record<string, unknown> {
    return this.props.config;
  }

  set config(value: Record<string, unknown>) {
    this.props.config = value;
    this.touch();
  }

  get assignToUsers(): string[] {
    return this.props.assignToUsers;
  }

  set assignToUsers(value: string[]) {
    this.props.assignToUsers = value;
    this.touch();
  }

  get maxLeadsPerUser(): number | undefined {
    return this.props.maxLeadsPerUser;
  }

  set maxLeadsPerUser(value: number | undefined) {
    this.props.maxLeadsPerUser = value;
    this.touch();
  }

  get lastAssignedIndex(): number {
    return this.props.lastAssignedIndex;
  }

  set lastAssignedIndex(value: number) {
    this.props.lastAssignedIndex = value;
    this.touch();
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  set isActive(value: boolean) {
    this.props.isActive = value;
    this.touch();
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get deletedAt(): Date | undefined {
    return this.props.deletedAt;
  }

  get isDeleted(): boolean {
    return !!this.props.deletedAt;
  }

  delete(): void {
    this.props.deletedAt = new Date();
    this.touch();
  }

  restore(): void {
    this.props.deletedAt = undefined;
    this.touch();
  }

  advanceRoundRobin(): string | null {
    if (this.assignToUsers.length === 0) return null;

    const nextIndex = this.lastAssignedIndex % this.assignToUsers.length;
    const assignedUserId = this.assignToUsers[nextIndex];
    this.props.lastAssignedIndex = nextIndex + 1;
    this.touch();

    return assignedUserId;
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  static create(
    props: Optional<
      LeadRoutingRuleProps,
      | 'id'
      | 'config'
      | 'assignToUsers'
      | 'lastAssignedIndex'
      | 'isActive'
      | 'createdAt'
      | 'updatedAt'
      | 'deletedAt'
    >,
    id?: UniqueEntityID,
  ): LeadRoutingRule {
    const ruleId = id ?? props.id ?? new UniqueEntityID();

    return new LeadRoutingRule(
      {
        ...props,
        id: ruleId,
        config: props.config ?? {},
        assignToUsers: props.assignToUsers ?? [],
        lastAssignedIndex: props.lastAssignedIndex ?? 0,
        isActive: props.isActive ?? true,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
        deletedAt: props.deletedAt,
      },
      ruleId,
    );
  }
}
