import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PPEAssignment } from '@/entities/hr/ppe-assignment';
import type {
  CreatePPEAssignmentSchema,
  FindPPEAssignmentFilters,
  FindExpiringAssignmentFilters,
  ReturnPPEAssignmentSchema,
  PPEAssignmentsRepository,
} from '../ppe-assignments-repository';

export class InMemoryPPEAssignmentsRepository
  implements PPEAssignmentsRepository
{
  private items: PPEAssignment[] = [];

  async create(data: CreatePPEAssignmentSchema): Promise<PPEAssignment> {
    const id = new UniqueEntityID();
    const assignment = PPEAssignment.create(
      {
        tenantId: new UniqueEntityID(data.tenantId),
        ppeItemId: new UniqueEntityID(data.ppeItemId),
        employeeId: new UniqueEntityID(data.employeeId),
        assignedAt: data.assignedAt,
        expiresAt: data.expiresAt,
        condition:
          (data.condition as PPEAssignment['condition']) ?? 'NEW',
        quantity: data.quantity,
        notes: data.notes,
        status: 'ACTIVE',
      },
      id,
    );

    this.items.push(assignment);
    return assignment;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<PPEAssignment | null> {
    const assignment = this.items.find(
      (item) =>
        item.id.equals(id) && item.tenantId.toString() === tenantId,
    );
    return assignment || null;
  }

  async findMany(
    tenantId: string,
    filters?: FindPPEAssignmentFilters,
  ): Promise<{ assignments: PPEAssignment[]; total: number }> {
    let filteredItems = this.items.filter(
      (item) => item.tenantId.toString() === tenantId,
    );

    if (filters?.employeeId) {
      filteredItems = filteredItems.filter(
        (item) => item.employeeId.toString() === filters.employeeId,
      );
    }

    if (filters?.ppeItemId) {
      filteredItems = filteredItems.filter(
        (item) => item.ppeItemId.toString() === filters.ppeItemId,
      );
    }

    if (filters?.status) {
      filteredItems = filteredItems.filter(
        (item) => item.status === filters.status,
      );
    }

    const total = filteredItems.length;
    const page = filters?.page ?? 1;
    const perPage = filters?.perPage ?? 20;
    const start = (page - 1) * perPage;

    return {
      assignments: filteredItems.slice(start, start + perPage),
      total,
    };
  }

  async findExpiring(
    tenantId: string,
    filters: FindExpiringAssignmentFilters,
  ): Promise<{ assignments: PPEAssignment[]; total: number }> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + filters.daysAhead);

    let filteredItems = this.items.filter(
      (item) =>
        item.tenantId.toString() === tenantId &&
        item.status === 'ACTIVE' &&
        item.expiresAt !== undefined &&
        item.expiresAt <= futureDate,
    );

    const total = filteredItems.length;
    const page = filters?.page ?? 1;
    const perPage = filters?.perPage ?? 20;
    const start = (page - 1) * perPage;

    return {
      assignments: filteredItems.slice(start, start + perPage),
      total,
    };
  }

  async returnAssignment(
    data: ReturnPPEAssignmentSchema,
  ): Promise<PPEAssignment | null> {
    const index = this.items.findIndex((item) => item.id.equals(data.id));
    if (index === -1) return null;

    const existing = this.items[index];

    const updatedAssignment = PPEAssignment.create(
      {
        tenantId: existing.tenantId,
        ppeItemId: existing.ppeItemId,
        employeeId: existing.employeeId,
        assignedAt: existing.assignedAt,
        returnedAt: new Date(),
        expiresAt: existing.expiresAt,
        condition: existing.condition,
        returnCondition:
          data.returnCondition as PPEAssignment['condition'],
        quantity: existing.quantity,
        notes: data.notes ?? existing.notes,
        status: 'RETURNED',
        createdAt: existing.createdAt,
      },
      existing.id,
    );

    this.items[index] = updatedAssignment;
    return updatedAssignment;
  }

  clear(): void {
    this.items = [];
  }
}
