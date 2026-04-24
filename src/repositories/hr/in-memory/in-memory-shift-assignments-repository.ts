import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { ShiftAssignment } from '@/entities/hr/shift-assignment';
import type {
  CreateShiftAssignmentSchema,
  ShiftAssignmentsRepository,
} from '../shift-assignments-repository';

export class InMemoryShiftAssignmentsRepository implements ShiftAssignmentsRepository {
  private items: ShiftAssignment[] = [];

  // Expose for testing
  get assignments(): ShiftAssignment[] {
    return this.items;
  }

  async create(data: CreateShiftAssignmentSchema): Promise<ShiftAssignment> {
    const id = new UniqueEntityID();
    const assignment = ShiftAssignment.create(
      {
        tenantId: new UniqueEntityID(data.tenantId),
        shiftId: new UniqueEntityID(data.shiftId),
        employeeId: new UniqueEntityID(data.employeeId),
        startDate: data.startDate,
        endDate: data.endDate,
        isActive: data.isActive ?? true,
        notes: data.notes,
      },
      id,
    );

    this.items.push(assignment);
    return assignment;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<ShiftAssignment | null> {
    const assignment = this.items.find(
      (item) => item.id.equals(id) && item.tenantId.toString() === tenantId,
    );
    return assignment || null;
  }

  async findActiveByEmployee(
    employeeId: string,
    tenantId: string,
  ): Promise<ShiftAssignment | null> {
    const assignment = this.items.find(
      (item) =>
        item.employeeId.toString() === employeeId &&
        item.tenantId.toString() === tenantId &&
        item.isActive,
    );
    return assignment || null;
  }

  async findActiveOnDate(
    employeeId: string,
    tenantId: string,
    date: Date,
  ): Promise<ShiftAssignment | null> {
    const target = date.getTime();
    const assignment = this.items.find(
      (item) =>
        item.employeeId.toString() === employeeId &&
        item.tenantId.toString() === tenantId &&
        item.isActive &&
        item.startDate.getTime() <= target &&
        (!item.endDate || item.endDate.getTime() >= target),
    );
    return assignment || null;
  }

  async existsForEmployeeOnDate(
    employeeId: string,
    tenantId: string,
    date: Date,
  ): Promise<boolean> {
    return (await this.findActiveOnDate(employeeId, tenantId, date)) !== null;
  }

  async findManyByShift(
    shiftId: string,
    tenantId: string,
  ): Promise<ShiftAssignment[]> {
    return this.items.filter(
      (item) =>
        item.shiftId.toString() === shiftId &&
        item.tenantId.toString() === tenantId,
    );
  }

  async findManyByEmployee(
    employeeId: string,
    tenantId: string,
  ): Promise<ShiftAssignment[]> {
    return this.items.filter(
      (item) =>
        item.employeeId.toString() === employeeId &&
        item.tenantId.toString() === tenantId,
    );
  }

  async deactivate(id: UniqueEntityID): Promise<ShiftAssignment | null> {
    const index = this.items.findIndex((item) => item.id.equals(id));
    if (index === -1) return null;

    this.items[index].deactivate();
    return this.items[index];
  }

  async delete(id: UniqueEntityID, tenantId?: string): Promise<void> {
    const index = this.items.findIndex(
      (item) =>
        item.id.equals(id) &&
        (!tenantId || item.tenantId.toString() === tenantId),
    );
    if (index !== -1) {
      this.items.splice(index, 1);
    }
  }
}
