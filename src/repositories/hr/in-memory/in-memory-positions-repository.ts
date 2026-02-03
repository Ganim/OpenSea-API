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
        tenantId: new UniqueEntityID(data.tenantId),
        name: data.name,
        code: data.code,
        description: data.description,
        departmentId: data.departmentId,
        level: data.level ?? 1,
        minSalary: data.minSalary,
        maxSalary: data.maxSalary,
        baseSalary: data.baseSalary,
        isActive: data.isActive ?? true,
      },
      id,
    );

    this.items.push(position);
    return position;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<Position | null> {
    const position = this.items.find(
      (item) =>
        item.id.equals(id) &&
        item.tenantId.toString() === tenantId &&
        !item.deletedAt,
    );
    return position || null;
  }

  async findByCode(code: string, tenantId: string): Promise<Position | null> {
    const position = this.items.find(
      (item) =>
        item.code === code &&
        item.tenantId.toString() === tenantId &&
        !item.deletedAt,
    );
    return position || null;
  }

  async findMany(
    params: FindManyPositionsParams,
  ): Promise<FindManyPositionsResult> {
    const {
      tenantId,
      page = 1,
      perPage = 20,
      search,
      isActive,
      departmentId,
      level,
    } = params;

    let filteredItems = this.items.filter(
      (item) => item.tenantId.toString() === tenantId && !item.deletedAt,
    );

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
    tenantId: string,
  ): Promise<Position[]> {
    return this.items.filter(
      (item) =>
        item.departmentId?.equals(departmentId) &&
        item.tenantId.toString() === tenantId &&
        !item.deletedAt,
    );
  }

  async findManyByCompany(
    companyId: UniqueEntityID,
    tenantId: string,
  ): Promise<Position[]> {
    // In real implementation, this would filter by department.companyId
    // For in-memory testing, return empty array - tests should mock this
    void companyId;
    void tenantId;
    return [];
  }

  async findManyByLevel(level: number, tenantId: string): Promise<Position[]> {
    return this.items.filter(
      (item) =>
        item.level === level &&
        item.tenantId.toString() === tenantId &&
        !item.deletedAt,
    );
  }

  async findManyActive(tenantId: string): Promise<Position[]> {
    return this.items.filter(
      (item) =>
        item.isActive &&
        item.tenantId.toString() === tenantId &&
        !item.deletedAt,
    );
  }

  async hasEmployees(id: UniqueEntityID): Promise<boolean> {
    // In real implementation, this would check the employees repository
    // For in-memory testing, we return false by default
    void id;
    return false;
  }

  async countEmployeesByPosition(positionId: UniqueEntityID): Promise<number> {
    // In real implementation, this would count employees in the employees repository
    // For in-memory testing, we return 0 by default
    void positionId;
    return 0;
  }

  async update(data: UpdatePositionSchema): Promise<Position | null> {
    const index = this.items.findIndex(
      (item) => item.id.equals(data.id) && !item.deletedAt,
    );

    if (index === -1) return null;

    const position = this.items[index];

    const updatedPosition = Position.create(
      {
        tenantId: position.tenantId,
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
        baseSalary:
          data.baseSalary === null
            ? undefined
            : (data.baseSalary ?? position.baseSalary),
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
