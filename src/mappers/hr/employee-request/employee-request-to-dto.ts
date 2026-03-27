import type { EmployeeRequest } from '@/entities/hr/employee-request';

export interface EmployeeRequestDTO {
  id: string;
  employeeId: string;
  type: string;
  status: string;
  data: Record<string, unknown>;
  approverEmployeeId?: string | null;
  approvedAt?: Date | null;
  rejectionReason?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export function employeeRequestToDTO(
  request: EmployeeRequest,
): EmployeeRequestDTO {
  return {
    id: request.id.toString(),
    employeeId: request.employeeId.toString(),
    type: request.type,
    status: request.status,
    data: request.data,
    approverEmployeeId: request.approverEmployeeId?.toString() ?? null,
    approvedAt: request.approvedAt ?? null,
    rejectionReason: request.rejectionReason ?? null,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
  };
}
