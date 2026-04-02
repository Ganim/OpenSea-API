import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
  EmployeeRequest,
  EmployeeRequestStatus,
  EmployeeRequestType,
} from '@/entities/hr/employee-request';

export interface FindEmployeeRequestFilters {
  employeeId?: UniqueEntityID;
  type?: EmployeeRequestType;
  status?: EmployeeRequestStatus;
}

export interface PaginatedEmployeeRequestsResult {
  employeeRequests: EmployeeRequest[];
  total: number;
}

export interface EmployeeRequestsRepository {
  create(request: EmployeeRequest): Promise<void>;
  findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<EmployeeRequest | null>;
  findManyByEmployee(
    employeeId: UniqueEntityID,
    tenantId: string,
    skip: number,
    take: number,
  ): Promise<PaginatedEmployeeRequestsResult>;
  findManyPendingByApprover(
    approverEmployeeIds: string[],
    tenantId: string,
    skip: number,
    take: number,
  ): Promise<PaginatedEmployeeRequestsResult>;
  save(request: EmployeeRequest): Promise<void>;
  delete(id: UniqueEntityID, tenantId: string): Promise<void>;
}
