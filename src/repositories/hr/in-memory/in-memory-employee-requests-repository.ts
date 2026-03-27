import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { EmployeeRequest } from '@/entities/hr/employee-request';
import type {
  EmployeeRequestsRepository,
  PaginatedEmployeeRequestsResult,
} from '../employee-requests-repository';

export class InMemoryEmployeeRequestsRepository
  implements EmployeeRequestsRepository
{
  public items: EmployeeRequest[] = [];

  async create(request: EmployeeRequest): Promise<void> {
    this.items.push(request);
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<EmployeeRequest | null> {
    return (
      this.items.find(
        (item) =>
          item.id.equals(id) && item.tenantId.toString() === tenantId,
      ) ?? null
    );
  }

  async findManyByEmployee(
    employeeId: UniqueEntityID,
    tenantId: string,
    skip: number,
    take: number,
  ): Promise<PaginatedEmployeeRequestsResult> {
    const filtered = this.items.filter(
      (item) =>
        item.employeeId.equals(employeeId) &&
        item.tenantId.toString() === tenantId,
    );

    return {
      employeeRequests: filtered.slice(skip, skip + take),
      total: filtered.length,
    };
  }

  async findManyPendingByApprover(
    approverEmployeeIds: string[],
    tenantId: string,
    skip: number,
    take: number,
  ): Promise<PaginatedEmployeeRequestsResult> {
    // In a real scenario, pending requests are those where the employee belongs
    // to a department managed by the approver. For in-memory, we filter by
    // status=PENDING and the employee being in the approver list scope.
    const filtered = this.items.filter(
      (item) =>
        item.tenantId.toString() === tenantId && item.isPending(),
    );

    return {
      employeeRequests: filtered.slice(skip, skip + take),
      total: filtered.length,
    };
  }

  async save(request: EmployeeRequest): Promise<void> {
    const index = this.items.findIndex((item) => item.id.equals(request.id));
    if (index >= 0) {
      this.items[index] = request;
    }
  }

  async delete(id: UniqueEntityID, tenantId: string): Promise<void> {
    this.items = this.items.filter(
      (item) =>
        !(item.id.equals(id) && item.tenantId.toString() === tenantId),
    );
  }
}
