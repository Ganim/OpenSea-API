import { Entity } from '../domain/entities';
import { UniqueEntityID } from '../domain/unique-entity-id';

export type VacationSplitStatus =
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export interface VacationSplitProps {
  vacationPeriodId: UniqueEntityID;
  splitNumber: number; // 1, 2, ou 3
  startDate: Date;
  endDate: Date;
  days: number;
  status: VacationSplitStatus;
  paymentDate?: Date;
  paymentAmount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export class VacationSplit extends Entity<VacationSplitProps> {
  get vacationPeriodId(): UniqueEntityID {
    return this.props.vacationPeriodId;
  }

  get splitNumber(): number {
    return this.props.splitNumber;
  }

  get startDate(): Date {
    return this.props.startDate;
  }

  get endDate(): Date {
    return this.props.endDate;
  }

  get days(): number {
    return this.props.days;
  }

  get status(): VacationSplitStatus {
    return this.props.status;
  }

  get paymentDate(): Date | undefined {
    return this.props.paymentDate;
  }

  get paymentAmount(): number | undefined {
    return this.props.paymentAmount;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Business methods
  isScheduled(): boolean {
    return this.status === 'SCHEDULED';
  }

  isInProgress(): boolean {
    return this.status === 'IN_PROGRESS';
  }

  isCompleted(): boolean {
    return this.status === 'COMPLETED';
  }

  isCancelled(): boolean {
    return this.status === 'CANCELLED';
  }

  canCancel(): boolean {
    return this.status === 'SCHEDULED';
  }

  cancel(): void {
    if (!this.canCancel()) {
      throw new Error('Apenas parcelas agendadas podem ser canceladas');
    }
    this.props.status = 'CANCELLED';
    this.props.updatedAt = new Date();
  }

  start(): void {
    if (this.status !== 'SCHEDULED') {
      throw new Error('Apenas parcelas agendadas podem ser iniciadas');
    }
    this.props.status = 'IN_PROGRESS';
    this.props.updatedAt = new Date();
  }

  complete(): void {
    if (this.status !== 'IN_PROGRESS') {
      throw new Error('Apenas parcelas em andamento podem ser concluídas');
    }
    this.props.status = 'COMPLETED';
    this.props.updatedAt = new Date();
  }

  private constructor(props: VacationSplitProps, id?: UniqueEntityID) {
    super(props, id);
  }

  static create(
    props: Omit<VacationSplitProps, 'createdAt' | 'updatedAt'> &
      Partial<Pick<VacationSplitProps, 'createdAt' | 'updatedAt'>>,
    id?: UniqueEntityID,
  ): VacationSplit {
    const now = new Date();
    return new VacationSplit(
      {
        ...props,
        status: props.status ?? 'SCHEDULED',
        createdAt: props.createdAt ?? now,
        updatedAt: props.updatedAt ?? now,
      },
      id,
    );
  }
}
