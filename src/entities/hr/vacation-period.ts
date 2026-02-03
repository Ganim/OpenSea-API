import { Entity } from '../domain/entities';
import { UniqueEntityID } from '../domain/unique-entity-id';
import { VacationStatus } from './value-objects';

export interface VacationPeriodProps {
  tenantId: UniqueEntityID;
  employeeId: UniqueEntityID;

  // Período Aquisitivo (12 meses de trabalho)
  acquisitionStart: Date;
  acquisitionEnd: Date;

  // Período Concessivo (12 meses para tirar férias)
  concessionStart: Date;
  concessionEnd: Date;

  // Dias de direito
  totalDays: number; // Default 30
  usedDays: number; // Dias já utilizados
  soldDays: number; // Abono pecuniário (max 10)
  remainingDays: number;

  // Controle
  status: VacationStatus;
  scheduledStart?: Date;
  scheduledEnd?: Date;
  notes?: string;

  createdAt: Date;
  updatedAt: Date;
}

export class VacationPeriod extends Entity<VacationPeriodProps> {
  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get employeeId(): UniqueEntityID {
    return this.props.employeeId;
  }

  get acquisitionStart(): Date {
    return this.props.acquisitionStart;
  }

  get acquisitionEnd(): Date {
    return this.props.acquisitionEnd;
  }

  get concessionStart(): Date {
    return this.props.concessionStart;
  }

  get concessionEnd(): Date {
    return this.props.concessionEnd;
  }

  get totalDays(): number {
    return this.props.totalDays;
  }

  get usedDays(): number {
    return this.props.usedDays;
  }

  get soldDays(): number {
    return this.props.soldDays;
  }

  get remainingDays(): number {
    return this.props.remainingDays;
  }

  get status(): VacationStatus {
    return this.props.status;
  }

  get scheduledStart(): Date | undefined {
    return this.props.scheduledStart;
  }

  get scheduledEnd(): Date | undefined {
    return this.props.scheduledEnd;
  }

  get notes(): string | undefined {
    return this.props.notes;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Business methods
  isPending(): boolean {
    return this.status.isPending();
  }

  isAvailable(): boolean {
    return this.status.isAvailable();
  }

  isScheduled(): boolean {
    return this.status.isScheduled();
  }

  isInProgress(): boolean {
    return this.status.isInProgress();
  }

  isCompleted(): boolean {
    return this.status.isCompleted();
  }

  isExpired(): boolean {
    return this.status.isExpired();
  }

  isSold(): boolean {
    return this.status.isSold();
  }

  hasRemainingDays(): boolean {
    return this.remainingDays > 0;
  }

  canSchedule(): boolean {
    return this.status.canSchedule() && this.remainingDays > 0;
  }

  canSellDays(): boolean {
    return this.status.canSell() && this.remainingDays > 0;
  }

  /**
   * Mark acquisition period as complete (employee worked 12 months)
   */
  completeAcquisition(): void {
    if (!this.isPending()) {
      throw new Error('Vacation period is not in pending acquisition status');
    }

    this.props.status = VacationStatus.available();
    this.props.updatedAt = new Date();
  }

  /**
   * Schedule vacation days
   */
  schedule(startDate: Date, endDate: Date, days: number): void {
    if (!this.canSchedule()) {
      throw new Error('Cannot schedule vacation in current status');
    }

    if (days > this.remainingDays) {
      throw new Error(
        `Cannot schedule ${days} days. Only ${this.remainingDays} days remaining`,
      );
    }

    // Validate minimum vacation period (according to Brazilian law)
    if (days < 5) {
      throw new Error('Minimum vacation period is 5 days');
    }

    // Cannot split into more than 3 periods
    // (This would require tracking split periods - simplified for now)

    this.props.scheduledStart = startDate;
    this.props.scheduledEnd = endDate;
    this.props.status = VacationStatus.scheduled();
    this.props.updatedAt = new Date();
  }

  /**
   * Cancel scheduled vacation
   */
  cancelSchedule(): void {
    if (!this.isScheduled()) {
      throw new Error('Vacation is not scheduled');
    }

    this.props.scheduledStart = undefined;
    this.props.scheduledEnd = undefined;
    this.props.status = VacationStatus.available();
    this.props.updatedAt = new Date();
  }

  /**
   * Start vacation (employee begins vacation)
   */
  startVacation(): void {
    if (!this.isScheduled()) {
      throw new Error('Vacation must be scheduled before starting');
    }

    this.props.status = VacationStatus.inProgress();
    this.props.updatedAt = new Date();
  }

  /**
   * Complete vacation period
   */
  complete(daysUsed: number): void {
    if (!this.isInProgress() && !this.isScheduled()) {
      throw new Error('Vacation must be in progress or scheduled to complete');
    }

    if (daysUsed > this.remainingDays) {
      throw new Error(
        `Cannot use ${daysUsed} days. Only ${this.remainingDays} days remaining`,
      );
    }

    this.props.usedDays = this.usedDays + daysUsed;
    this.props.remainingDays = this.totalDays - this.usedDays - this.soldDays;

    // If all days used, mark as completed
    if (this.props.remainingDays <= 0) {
      this.props.status = VacationStatus.completed();
    } else {
      this.props.status = VacationStatus.available();
    }

    this.props.scheduledStart = undefined;
    this.props.scheduledEnd = undefined;
    this.props.updatedAt = new Date();
  }

  /**
   * Sell vacation days (abono pecuniário)
   * Maximum 1/3 of vacation days (10 days) can be sold
   */
  sellDays(daysToSell: number): void {
    if (!this.canSellDays()) {
      throw new Error('Cannot sell vacation days in current status');
    }

    const maxSellableDays = Math.floor(this.totalDays / 3); // 1/3 of total
    const alreadySold = this.soldDays;
    const canStillSell = maxSellableDays - alreadySold;

    if (daysToSell > canStillSell) {
      throw new Error(
        `Cannot sell ${daysToSell} days. Maximum sellable: ${canStillSell} days`,
      );
    }

    if (daysToSell > this.remainingDays) {
      throw new Error(
        `Cannot sell ${daysToSell} days. Only ${this.remainingDays} days remaining`,
      );
    }

    this.props.soldDays = this.soldDays + daysToSell;
    this.props.remainingDays = this.totalDays - this.usedDays - this.soldDays;
    this.props.updatedAt = new Date();

    // If all days used/sold, mark as sold
    if (this.props.remainingDays <= 0) {
      this.props.status = VacationStatus.sold();
    }
  }

  /**
   * Mark vacation period as expired (concession period ended without usage)
   */
  expire(): void {
    if (this.isCompleted() || this.isExpired()) {
      throw new Error('Vacation period is already finalized');
    }

    this.props.status = VacationStatus.expired();
    this.props.updatedAt = new Date();
  }

  /**
   * Update notes
   */
  updateNotes(notes: string): void {
    this.props.notes = notes;
    this.props.updatedAt = new Date();
  }

  /**
   * Check if the concession period is expired
   */
  isConcessionExpired(): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return this.concessionEnd < today;
  }

  /**
   * Check if the vacation period is currently active (today is within vacation dates)
   */
  isCurrentlyOnVacation(): boolean {
    if (!this.scheduledStart || !this.scheduledEnd) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return (
      this.isInProgress() &&
      this.scheduledStart <= today &&
      this.scheduledEnd >= today
    );
  }

  private constructor(props: VacationPeriodProps, id?: UniqueEntityID) {
    super(props, id);
  }

  static create(
    props: Omit<VacationPeriodProps, 'createdAt' | 'updatedAt'>,
    id?: UniqueEntityID,
  ): VacationPeriod {
    const now = new Date();
    return new VacationPeriod(
      {
        ...props,
        createdAt: now,
        updatedAt: now,
      },
      id,
    );
  }

  /**
   * Create a new vacation period from hire date
   * Acquisition period: hire date to 12 months later
   * Concession period: 12 months after acquisition ends
   */
  static createFromHireDate(
    tenantId: UniqueEntityID,
    employeeId: UniqueEntityID,
    hireDate: Date,
    totalDays: number = 30,
    id?: UniqueEntityID,
  ): VacationPeriod {
    const acquisitionStart = new Date(hireDate);
    const acquisitionEnd = new Date(hireDate);
    acquisitionEnd.setFullYear(acquisitionEnd.getFullYear() + 1);
    acquisitionEnd.setDate(acquisitionEnd.getDate() - 1);

    const concessionStart = new Date(acquisitionEnd);
    concessionStart.setDate(concessionStart.getDate() + 1);
    const concessionEnd = new Date(concessionStart);
    concessionEnd.setFullYear(concessionEnd.getFullYear() + 1);
    concessionEnd.setDate(concessionEnd.getDate() - 1);

    return VacationPeriod.create(
      {
        tenantId,
        employeeId,
        acquisitionStart,
        acquisitionEnd,
        concessionStart,
        concessionEnd,
        totalDays,
        usedDays: 0,
        soldDays: 0,
        remainingDays: totalDays,
        status: VacationStatus.pending(),
      },
      id,
    );
  }
}
