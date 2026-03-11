import { Entity } from '../domain/entities';
import { UniqueEntityID } from '../domain/unique-entity-id';

export type CompanyCnaeStatus = 'ACTIVE' | 'INACTIVE';

export interface CompanyCnaeProps {
  companyId: UniqueEntityID;
  code: string;
  description?: string | null;
  isPrimary: boolean;
  status: CompanyCnaeStatus;
  metadata: Record<string, unknown>;
  pendingIssues: string[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export class CompanyCnae extends Entity<CompanyCnaeProps> {
  static create(props: CompanyCnaeProps, id?: UniqueEntityID): CompanyCnae {
    const cnae = new this(props, id);
    return cnae;
  }

  get companyId(): UniqueEntityID {
    return this.props.companyId;
  }

  get code(): string {
    return this.props.code;
  }

  get description(): string | null | undefined {
    return this.props.description;
  }

  get isPrimary(): boolean {
    return this.props.isPrimary;
  }

  set isPrimary(value: boolean) {
    this.props.isPrimary = value;
  }

  get status(): CompanyCnaeStatus {
    return this.props.status;
  }

  set status(value: CompanyCnaeStatus) {
    this.props.status = value;
  }

  get metadata(): Record<string, unknown> {
    return this.props.metadata;
  }

  get pendingIssues(): string[] {
    return this.props.pendingIssues;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get deletedAt(): Date | null | undefined {
    return this.props.deletedAt;
  }

  update(input: {
    description?: string;
    isPrimary?: boolean;
    status?: CompanyCnaeStatus;
    metadata?: Record<string, unknown>;
    pendingIssues?: string[];
  }): void {
    if (input.description !== undefined) {
      this.props.description = input.description ?? undefined;
    }
    if (input.isPrimary !== undefined) {
      this.props.isPrimary = input.isPrimary;
    }
    if (input.status !== undefined) {
      this.props.status = input.status;
    }
    if (input.metadata !== undefined) {
      this.props.metadata = input.metadata;
    }
    if (input.pendingIssues !== undefined) {
      this.props.pendingIssues = input.pendingIssues;
    }
    this.props.updatedAt = new Date();
  }

  markAsDeleted(): void {
    this.props.deletedAt = new Date();
    this.props.updatedAt = new Date();
  }

  restore(): void {
    this.props.deletedAt = undefined;
    this.props.updatedAt = new Date();
  }
}
