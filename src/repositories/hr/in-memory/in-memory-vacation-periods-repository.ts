import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { VacationPeriod } from '@/entities/hr/vacation-period';
import { VacationStatus } from '@/entities/hr/value-objects';
import type {
  CreateVacationPeriodSchema,
  FindVacationPeriodFilters,
  UpdateVacationPeriodSchema,
  VacationPeriodsRepository,
} from '../vacation-periods-repository';

export class InMemoryVacationPeriodsRepository implements VacationPeriodsRepository {
  public items: VacationPeriod[] = [];

  async create(data: CreateVacationPeriodSchema): Promise<VacationPeriod> {
    const vacationPeriod = VacationPeriod.create({
      tenantId: new UniqueEntityID(data.tenantId),
      employeeId: data.employeeId,
      acquisitionStart: data.acquisitionStart,
      acquisitionEnd: data.acquisitionEnd,
      concessionStart: data.concessionStart,
      concessionEnd: data.concessionEnd,
      totalDays: data.totalDays,
      usedDays: data.usedDays ?? 0,
      soldDays: data.soldDays ?? 0,
      remainingDays: data.remainingDays ?? data.totalDays,
      status: data.status
        ? VacationStatus.create(data.status)
        : VacationStatus.pending(),
      notes: data.notes,
    });

    this.items.push(vacationPeriod);
    return vacationPeriod;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<VacationPeriod | null> {
    return (
      this.items.find(
        (item) => item.id.equals(id) && item.tenantId.toString() === tenantId,
      ) ?? null
    );
  }

  async findMany(
    tenantId: string,
    filters?: FindVacationPeriodFilters,
  ): Promise<VacationPeriod[]> {
    let filtered = this.items.filter(
      (item) => item.tenantId.toString() === tenantId,
    );

    if (filters?.employeeId) {
      filtered = filtered.filter((item) =>
        item.employeeId.equals(filters.employeeId!),
      );
    }
    if (filters?.status) {
      filtered = filtered.filter(
        (item) => item.status.value === filters.status,
      );
    }
    if (filters?.year) {
      const startOfYear = new Date(filters.year, 0, 1);
      const endOfYear = new Date(filters.year, 11, 31);
      filtered = filtered.filter(
        (item) =>
          item.acquisitionStart <= endOfYear &&
          item.concessionEnd >= startOfYear,
      );
    }

    return filtered.sort(
      (a, b) => b.acquisitionStart.getTime() - a.acquisitionStart.getTime(),
    );
  }

  async findManyByEmployee(
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<VacationPeriod[]> {
    return this.items
      .filter(
        (item) =>
          item.employeeId.equals(employeeId) &&
          item.tenantId.toString() === tenantId,
      )
      .sort(
        (a, b) => b.acquisitionStart.getTime() - a.acquisitionStart.getTime(),
      );
  }

  async findManyByEmployeeAndStatus(
    employeeId: UniqueEntityID,
    status: string,
    tenantId: string,
  ): Promise<VacationPeriod[]> {
    return this.items
      .filter(
        (item) =>
          item.employeeId.equals(employeeId) &&
          item.status.value === status &&
          item.tenantId.toString() === tenantId,
      )
      .sort(
        (a, b) => b.acquisitionStart.getTime() - a.acquisitionStart.getTime(),
      );
  }

  async findManyByStatus(
    status: string,
    tenantId: string,
  ): Promise<VacationPeriod[]> {
    return this.items
      .filter(
        (item) =>
          item.status.value === status && item.tenantId.toString() === tenantId,
      )
      .sort(
        (a, b) => b.acquisitionStart.getTime() - a.acquisitionStart.getTime(),
      );
  }

  async findAvailableByEmployee(
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<VacationPeriod[]> {
    return this.items
      .filter(
        (item) =>
          item.employeeId.equals(employeeId) &&
          item.tenantId.toString() === tenantId &&
          (item.status.isAvailable() || item.status.isScheduled()) &&
          item.remainingDays > 0,
      )
      .sort((a, b) => a.concessionEnd.getTime() - b.concessionEnd.getTime());
  }

  async findCurrentByEmployee(
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<VacationPeriod | null> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return (
      this.items.find(
        (item) =>
          item.employeeId.equals(employeeId) &&
          item.tenantId.toString() === tenantId &&
          item.status.isPending() &&
          item.acquisitionEnd >= today,
      ) ?? null
    );
  }

  async findApprovedCoveringDate(
    employeeId: string,
    tenantId: string,
    date: Date,
  ): Promise<VacationPeriod | null> {
    const target = date.getTime();
    return (
      this.items.find(
        (item) =>
          item.employeeId.toString() === employeeId &&
          item.tenantId.toString() === tenantId &&
          (item.status.isScheduled() || item.status.isInProgress()) &&
          item.scheduledStart !== undefined &&
          item.scheduledEnd !== undefined &&
          item.scheduledStart.getTime() <= target &&
          item.scheduledEnd.getTime() >= target,
      ) ?? null
    );
  }

  async findExpiring(
    beforeDate: Date,
    tenantId: string,
  ): Promise<VacationPeriod[]> {
    return this.items
      .filter(
        (item) =>
          item.tenantId.toString() === tenantId &&
          (item.status.isAvailable() || item.status.isScheduled()) &&
          item.concessionEnd <= beforeDate &&
          item.remainingDays > 0,
      )
      .sort((a, b) => a.concessionEnd.getTime() - b.concessionEnd.getTime());
  }

  async findExpiredPeriods(tenantId: string): Promise<VacationPeriod[]> {
    const now = new Date();
    return this.items
      .filter(
        (item) =>
          item.tenantId.toString() === tenantId &&
          item.concessionEnd < now &&
          !item.isCompleted() &&
          !item.isExpired() &&
          !item.isSold(),
      )
      .sort((a, b) => a.concessionEnd.getTime() - b.concessionEnd.getTime());
  }

  async update(
    data: UpdateVacationPeriodSchema,
  ): Promise<VacationPeriod | null> {
    const index = this.items.findIndex((item) => item.id.equals(data.id));
    if (index === -1) return null;

    const vacationPeriod = this.items[index];

    if (data.acquisitionStart !== undefined)
      vacationPeriod.props.acquisitionStart = data.acquisitionStart;
    if (data.acquisitionEnd !== undefined)
      vacationPeriod.props.acquisitionEnd = data.acquisitionEnd;
    if (data.concessionStart !== undefined)
      vacationPeriod.props.concessionStart = data.concessionStart;
    if (data.concessionEnd !== undefined)
      vacationPeriod.props.concessionEnd = data.concessionEnd;
    if (data.totalDays !== undefined)
      vacationPeriod.props.totalDays = data.totalDays;
    if (data.usedDays !== undefined)
      vacationPeriod.props.usedDays = data.usedDays;
    if (data.soldDays !== undefined)
      vacationPeriod.props.soldDays = data.soldDays;
    if (data.remainingDays !== undefined)
      vacationPeriod.props.remainingDays = data.remainingDays;
    if (data.status !== undefined)
      vacationPeriod.props.status = VacationStatus.create(data.status);
    if (data.scheduledStart !== undefined)
      vacationPeriod.props.scheduledStart = data.scheduledStart ?? undefined;
    if (data.scheduledEnd !== undefined)
      vacationPeriod.props.scheduledEnd = data.scheduledEnd ?? undefined;
    if (data.notes !== undefined) vacationPeriod.props.notes = data.notes;
    vacationPeriod.props.updatedAt = new Date();

    return vacationPeriod;
  }

  async save(vacationPeriod: VacationPeriod): Promise<void> {
    const index = this.items.findIndex((item) =>
      item.id.equals(vacationPeriod.id),
    );
    if (index >= 0) {
      this.items[index] = vacationPeriod;
    }
  }

  async delete(id: UniqueEntityID, tenantId?: string): Promise<void> {
    const index = this.items.findIndex(
      (item) =>
        item.id.equals(id) &&
        (!tenantId || item.tenantId.toString() === tenantId),
    );
    if (index >= 0) {
      this.items.splice(index, 1);
    }
  }
}
