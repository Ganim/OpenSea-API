import { Entity } from '../domain/entities';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface BenefitEnrollmentProps {
  tenantId: UniqueEntityID;
  employeeId: UniqueEntityID;
  benefitPlanId: UniqueEntityID;
  startDate: Date;
  endDate?: Date;
  status: string;
  employeeContribution: number;
  employerContribution: number;
  dependantIds?: string[];
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export class BenefitEnrollment extends Entity<BenefitEnrollmentProps> {
  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get employeeId(): UniqueEntityID {
    return this.props.employeeId;
  }

  get benefitPlanId(): UniqueEntityID {
    return this.props.benefitPlanId;
  }

  get startDate(): Date {
    return this.props.startDate;
  }

  get endDate(): Date | undefined {
    return this.props.endDate;
  }

  get status(): string {
    return this.props.status;
  }

  get employeeContribution(): number {
    return this.props.employeeContribution;
  }

  get employerContribution(): number {
    return this.props.employerContribution;
  }

  get dependantIds(): string[] | undefined {
    return this.props.dependantIds;
  }

  get metadata(): Record<string, unknown> | undefined {
    return this.props.metadata;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  isActive(): boolean {
    return this.props.status === 'ACTIVE';
  }

  cancel(): void {
    this.props.status = 'CANCELLED';
    this.props.endDate = new Date();
    this.props.updatedAt = new Date();
  }

  suspend(): void {
    this.props.status = 'SUSPENDED';
    this.props.updatedAt = new Date();
  }

  reactivate(): void {
    this.props.status = 'ACTIVE';
    this.props.endDate = undefined;
    this.props.updatedAt = new Date();
  }

  updateContributions(
    employeeContribution: number,
    employerContribution: number,
  ): void {
    this.props.employeeContribution = employeeContribution;
    this.props.employerContribution = employerContribution;
    this.props.updatedAt = new Date();
  }

  private constructor(props: BenefitEnrollmentProps, id?: UniqueEntityID) {
    super(props, id);
  }

  static create(
    props: Omit<BenefitEnrollmentProps, 'createdAt' | 'updatedAt'> & {
      createdAt?: Date;
      updatedAt?: Date;
    },
    id?: UniqueEntityID,
  ): BenefitEnrollment {
    const now = new Date();

    return new BenefitEnrollment(
      {
        ...props,
        status: props.status ?? 'ACTIVE',
        employeeContribution: props.employeeContribution ?? 0,
        employerContribution: props.employerContribution ?? 0,
        createdAt: props.createdAt ?? now,
        updatedAt: props.updatedAt ?? now,
      },
      id,
    );
  }
}
