import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Shift } from '@/entities/hr/shift';
import type {
  CreateShiftSchema,
  ShiftsRepository,
  UpdateShiftSchema,
} from '../shifts-repository';

export class InMemoryShiftsRepository implements ShiftsRepository {
  private items: Shift[] = [];

  // Expose for testing
  get shifts(): Shift[] {
    return this.items;
  }

  async create(data: CreateShiftSchema): Promise<Shift> {
    const id = new UniqueEntityID();
    const shift = Shift.create(
      {
        tenantId: new UniqueEntityID(data.tenantId),
        name: data.name,
        code: data.code,
        type: data.type,
        startTime: data.startTime,
        endTime: data.endTime,
        breakMinutes: data.breakMinutes,
        isNightShift: data.isNightShift ?? false,
        color: data.color,
        isActive: data.isActive ?? true,
      },
      id,
    );

    this.items.push(shift);
    return shift;
  }

  async findById(id: UniqueEntityID, tenantId: string): Promise<Shift | null> {
    const shift = this.items.find(
      (item) =>
        item.id.equals(id) &&
        item.tenantId.toString() === tenantId &&
        !item.deletedAt,
    );
    return shift || null;
  }

  async findByName(name: string, tenantId: string): Promise<Shift | null> {
    const shift = this.items.find(
      (item) =>
        item.name === name &&
        item.tenantId.toString() === tenantId &&
        !item.deletedAt,
    );
    return shift || null;
  }

  async findByCode(code: string, tenantId: string): Promise<Shift | null> {
    const shift = this.items.find(
      (item) =>
        item.code === code &&
        item.tenantId.toString() === tenantId &&
        !item.deletedAt,
    );
    return shift || null;
  }

  async findMany(tenantId: string): Promise<Shift[]> {
    return this.items.filter(
      (item) => item.tenantId.toString() === tenantId && !item.deletedAt,
    );
  }

  async findManyActive(tenantId: string): Promise<Shift[]> {
    return this.items.filter(
      (item) =>
        item.isActive &&
        item.tenantId.toString() === tenantId &&
        !item.deletedAt,
    );
  }

  async update(data: UpdateShiftSchema): Promise<Shift | null> {
    const index = this.items.findIndex(
      (item) => item.id.equals(data.id) && !item.deletedAt,
    );
    if (index === -1) return null;

    const existing = this.items[index];

    const updated = Shift.create(
      {
        tenantId: existing.tenantId,
        name: data.name ?? existing.name,
        code:
          data.code !== undefined ? (data.code ?? undefined) : existing.code,
        type: data.type ?? existing.type,
        startTime: data.startTime ?? existing.startTime,
        endTime: data.endTime ?? existing.endTime,
        breakMinutes: data.breakMinutes ?? existing.breakMinutes,
        isNightShift: data.isNightShift ?? existing.isNightShift,
        color:
          data.color !== undefined ? (data.color ?? undefined) : existing.color,
        isActive: data.isActive ?? existing.isActive,
      },
      existing.id,
    );

    this.items[index] = updated;
    return updated;
  }

  async softDelete(id: UniqueEntityID): Promise<void> {
    const index = this.items.findIndex((item) => item.id.equals(id));
    if (index !== -1) {
      this.items[index].softDelete();
    }
  }

  async countAssignments(_shiftId: UniqueEntityID): Promise<number> {
    // This is a cross-repository concern; in tests, we can set this up externally
    return 0;
  }
}
