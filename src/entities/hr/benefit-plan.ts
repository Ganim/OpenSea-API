import { Entity } from '../domain/entities';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface BenefitPlanProps {
  tenantId: UniqueEntityID;
  name: string;
  type: string;
  provider?: string;
  policyNumber?: string;
  isActive: boolean;
  rules?: Record<string, unknown>;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class BenefitPlan extends Entity<BenefitPlanProps> {
  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get name(): string {
    return this.props.name;
  }

  get type(): string {
    return this.props.type;
  }

  get provider(): string | undefined {
    return this.props.provider;
  }

  get policyNumber(): string | undefined {
    return this.props.policyNumber;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get rules(): Record<string, unknown> | undefined {
    return this.props.rules;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  activate(): void {
    this.props.isActive = true;
    this.props.updatedAt = new Date();
  }

  updateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('Benefit plan name cannot be empty');
    }
    this.props.name = name;
    this.props.updatedAt = new Date();
  }

  updateRules(rules: Record<string, unknown>): void {
    this.props.rules = rules;
    this.props.updatedAt = new Date();
  }

  private constructor(props: BenefitPlanProps, id?: UniqueEntityID) {
    super(props, id);
  }

  static create(
    props: Omit<BenefitPlanProps, 'createdAt' | 'updatedAt'> & {
      createdAt?: Date;
      updatedAt?: Date;
    },
    id?: UniqueEntityID,
  ): BenefitPlan {
    const now = new Date();

    return new BenefitPlan(
      {
        ...props,
        isActive: props.isActive ?? true,
        createdAt: props.createdAt ?? now,
        updatedAt: props.updatedAt ?? now,
      },
      id,
    );
  }
}
