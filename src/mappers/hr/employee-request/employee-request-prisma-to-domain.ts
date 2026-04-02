import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
  EmployeeRequestStatus,
  EmployeeRequestType,
} from '@/entities/hr/employee-request';

export function mapEmployeeRequestPrismaToDomain(raw: Record<string, unknown>) {
  return {
    tenantId: new UniqueEntityID(raw.tenantId as string),
    employeeId: new UniqueEntityID(raw.employeeId as string),
    type: raw.type as EmployeeRequestType,
    status: raw.status as EmployeeRequestStatus,
    data: (raw.data as Record<string, unknown>) ?? {},
    approverEmployeeId: raw.approverEmployeeId
      ? new UniqueEntityID(raw.approverEmployeeId as string)
      : undefined,
    approvedAt: (raw.approvedAt as Date) ?? undefined,
    rejectionReason: (raw.rejectionReason as string) ?? undefined,
    createdAt: raw.createdAt as Date,
    updatedAt: raw.updatedAt as Date,
  };
}
