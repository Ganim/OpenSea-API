import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { EmployeeWarning } from '@/entities/hr/employee-warning';
import {
  WarningSeverity,
  WarningStatus,
  WarningType,
} from '@/entities/hr/value-objects';
import type {
  CreateEmployeeWarningSchema,
  EmployeeWarningsRepository,
  FindEmployeeWarningFilters,
  PaginatedEmployeeWarningsResult,
  SoftDeleteEmployeeWarningSchema,
  UpdateEmployeeWarningSchema,
} from '../employee-warnings-repository';

export class InMemoryEmployeeWarningsRepository
  implements EmployeeWarningsRepository
{
  public items: EmployeeWarning[] = [];

  async create(data: CreateEmployeeWarningSchema): Promise<EmployeeWarning> {
    const warning = EmployeeWarning.create({
      tenantId: new UniqueEntityID(data.tenantId),
      employeeId: data.employeeId,
      issuedBy: data.issuedBy,
      type: WarningType.create(data.type),
      severity: WarningSeverity.create(data.severity),
      status: WarningStatus.active(),
      reason: data.reason,
      description: data.description,
      incidentDate: data.incidentDate,
      witnessName: data.witnessName,
      suspensionDays: data.suspensionDays,
      attachmentUrl: data.attachmentUrl,
      employeeAcknowledged: false,
    });

    this.items.push(warning);
    return warning;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
    options?: { includeDeleted?: boolean },
  ): Promise<EmployeeWarning | null> {
    const includeDeleted = options?.includeDeleted ?? false;
    return (
      this.items.find(
        (item) =>
          item.id.equals(id) &&
          item.tenantId.toString() === tenantId &&
          (includeDeleted || !item.deletedAt),
      ) ?? null
    );
  }

  async findManyPaginated(
    tenantId: string,
    filters: FindEmployeeWarningFilters,
    skip: number,
    take: number,
  ): Promise<PaginatedEmployeeWarningsResult> {
    const includeDeleted = filters.includeDeleted ?? false;
    let filtered = this.items.filter(
      (item) =>
        item.tenantId.toString() === tenantId &&
        (includeDeleted || !item.deletedAt),
    );

    if (filters.employeeId) {
      filtered = filtered.filter((item) =>
        item.employeeId.equals(filters.employeeId!),
      );
    }
    if (filters.type) {
      filtered = filtered.filter((item) => item.type.value === filters.type);
    }
    if (filters.severity) {
      filtered = filtered.filter(
        (item) => item.severity.value === filters.severity,
      );
    }
    if (filters.status) {
      filtered = filtered.filter(
        (item) => item.status.value === filters.status,
      );
    }

    const total = filtered.length;
    const warnings = filtered
      .sort((a, b) => b.incidentDate.getTime() - a.incidentDate.getTime())
      .slice(skip, skip + take);

    return { warnings, total };
  }

  async findManyByEmployee(
    employeeId: UniqueEntityID,
    tenantId: string,
    options?: { includeDeleted?: boolean },
  ): Promise<EmployeeWarning[]> {
    const includeDeleted = options?.includeDeleted ?? false;
    return this.items
      .filter(
        (item) =>
          item.employeeId.equals(employeeId) &&
          item.tenantId.toString() === tenantId &&
          (includeDeleted || !item.deletedAt),
      )
      .sort((a, b) => b.incidentDate.getTime() - a.incidentDate.getTime());
  }

  async countActiveByEmployee(
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<number> {
    return this.items.filter(
      (item) =>
        item.employeeId.equals(employeeId) &&
        item.tenantId.toString() === tenantId &&
        item.status.isActive() &&
        !item.deletedAt,
    ).length;
  }

  async update(
    data: UpdateEmployeeWarningSchema,
  ): Promise<EmployeeWarning | null> {
    const index = this.items.findIndex((item) => item.id.equals(data.id));
    if (index === -1) return null;

    const warning = this.items[index];

    if (data.type !== undefined)
      warning.props.type = WarningType.create(data.type);
    if (data.severity !== undefined)
      warning.props.severity = WarningSeverity.create(data.severity);
    if (data.reason !== undefined) warning.props.reason = data.reason;
    if (data.description !== undefined)
      warning.props.description = data.description;
    if (data.incidentDate !== undefined)
      warning.props.incidentDate = data.incidentDate;
    if (data.witnessName !== undefined)
      warning.props.witnessName = data.witnessName;
    if (data.suspensionDays !== undefined)
      warning.props.suspensionDays = data.suspensionDays;
    if (data.attachmentUrl !== undefined)
      warning.props.attachmentUrl = data.attachmentUrl;
    warning.props.updatedAt = new Date();

    return warning;
  }

  async save(warning: EmployeeWarning): Promise<void> {
    const index = this.items.findIndex((item) => item.id.equals(warning.id));
    if (index >= 0) {
      this.items[index] = warning;
    }
  }

  async softDelete(data: SoftDeleteEmployeeWarningSchema): Promise<void> {
    const warning = this.items.find(
      (item) =>
        item.id.equals(data.id) &&
        item.tenantId.toString() === data.tenantId &&
        !item.deletedAt,
    );
    if (!warning) return;
    warning.softDelete(data.deletedBy);
  }
}
