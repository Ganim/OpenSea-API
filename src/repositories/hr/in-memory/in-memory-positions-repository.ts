import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Position } from '@/entities/hr/position';
import type {
  CreatePositionSchema,
  FindManyPositionsParams,
  FindManyPositionsResult,
  PositionsRepository,
  UpdatePositionSchema,
} from '../positions-repository';

export class InMemoryPositionsRepository implements PositionsRepository {
  private items: Position[] = [];

  async create(data: CreatePositionSchema): Promise<Position> {
    const id = new UniqueEntityID();
    const position = Position.create(
      {
        name: data.name,
        code: data.code,
        description: data.description,
        departmentId: data.departmentId,
        level: data.level ?? 1,
        minSalary: data.minSalary,
        maxSalary: data.maxSalary,
        isActive: data.isActive ?? true,
      },
      id,
    );

    this.items.push(position);
    return position;
  }

  async findById(id: UniqueEntityID): Promise<Position | null> {
    const position = this.items.find(
      (item) => item.id.equals(id) && !item.deletedAt,
    );
    return position || null;
  }

  async findByCode(code: string): Promise<Position | null> {
    const position = this.items.find(
      (item) => item.code === code && !item.deletedAt,
    );
    return position || null;
  }

  async findMany(
    params: FindManyPositionsParams,
  ): Promise<FindManyPositionsResult> {
    const {
      page = 1,
      perPage = 20,
      search,
      isActive,
      departmentId,
      level,
    } = params;

    let filteredItems = this.items.filter((item) => !item.deletedAt);

    if (search) {
      const searchLower = search.toLowerCase();
      filteredItems = filteredItems.filter(
        (item) =>
          item.name.toLowerCase().includes(searchLower) ||
          item.code.toLowerCase().includes(searchLower),
      );
    }

    if (isActive !== undefined) {
      filteredItems = filteredItems.filter(
        (item) => item.isActive === isActive,
      );
    }

    if (departmentId) {
      filteredItems = filteredItems.filter((item) =>
        item.departmentId?.equals(departmentId),
      );
    }

    if (level !== undefined) {
      filteredItems = filteredItems.filter((item) => item.level === level);
    }

    const total = filteredItems.length;
    const start = (page - 1) * perPage;
    const positions = filteredItems.slice(start, start + perPage);

    return { positions, total };
  }

  async findManyByDepartment(
    departmentId: UniqueEntityID,
  ): Promise<Position[]> {
    return this.items.filter(
      (item) => item.departmentId?.equals(departmentId) && !item.deletedAt,
    );
  }

  async findManyByLevel(level: number): Promise<Position[]> {
    return this.items.filter((item) => item.level === level && !item.deletedAt);
  }

  async findManyActive(): Promise<Position[]> {
    return this.items.filter((item) => item.isActive && !item.deletedAt);
  }

  async hasEmployees(id: UniqueEntityID): Promise<boolean> {
    // In real implementation, this would check the employees repository
    // For in-memory testing, we return false by default
    void id;
    return false;
  }

  async update(data: UpdatePositionSchema): Promise<Position | null> {
    const index = this.items.findIndex(
      (item) => item.id.equals(data.id) && !item.deletedAt,
    );

    if (index === -1) return null;

    const position = this.items[index];

    const updatedPosition = Position.create(
      {
        name: data.name ?? position.name,
        code: data.code ?? position.code,
        description:
          data.description === null
            ? undefined
            : (data.description ?? position.description),
        departmentId:
          data.departmentId === null
            ? undefined
            : (data.departmentId ?? position.departmentId),
        level: data.level ?? position.level,
        minSalary:
          data.minSalary === null
            ? undefined
            : (data.minSalary ?? position.minSalary),
        maxSalary:
          data.maxSalary === null
            ? undefined
            : (data.maxSalary ?? position.maxSalary),
        isActive: data.isActive ?? position.isActive,
        deletedAt: position.deletedAt,
      },
      position.id,
    );

    this.items[index] = updatedPosition;
    return updatedPosition;
  }

  async save(position: Position): Promise<void> {
    const index = this.items.findIndex((item) => item.id.equals(position.id));

    if (index !== -1) {
      this.items[index] = position;
    } else {
      this.items.push(position);
    }
  }

  async delete(id: UniqueEntityID): Promise<void> {
    const index = this.items.findIndex((item) => item.id.equals(id));

    if (index !== -1) {
      this.items[index].softDelete();
    }
  }

  // Helper for tests
  clear(): void {
    this.items = [];
  }
}
