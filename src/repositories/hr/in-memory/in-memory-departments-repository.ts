import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Department } from '@/entities/hr/department';
import type {
  CreateDepartmentSchema,
  DepartmentsRepository,
  FindManyDepartmentsParams,
  FindManyDepartmentsResult,
  UpdateDepartmentSchema,
} from '../departments-repository';

export class InMemoryDepartmentsRepository implements DepartmentsRepository {
  private items: Department[] = [];

  async create(data: CreateDepartmentSchema): Promise<Department> {
    const id = new UniqueEntityID();
    const department = Department.create(
      {
        tenantId: new UniqueEntityID(data.tenantId),
        name: data.name,
        code: data.code,
        description: data.description,
        parentId: data.parentId,
        managerId: data.managerId,
        companyId: data.companyId,
        isActive: data.isActive ?? true,
      },
      id,
    );

    this.items.push(department);
    return department;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<Department | null> {
    const department = this.items.find(
      (item) =>
        item.id.equals(id) &&
        item.tenantId.toString() === tenantId &&
        !item.deletedAt,
    );
    return department || null;
  }

  async findByCode(
    code: string,
    companyId: UniqueEntityID,
    tenantId: string,
  ): Promise<Department | null> {
    const department = this.items.find(
      (item) =>
        item.code === code &&
        item.companyId.equals(companyId) &&
        item.tenantId.toString() === tenantId &&
        !item.deletedAt,
    );
    return department || null;
  }

  async findMany(
    params: FindManyDepartmentsParams,
  ): Promise<FindManyDepartmentsResult> {
    const {
      tenantId,
      page = 1,
      perPage = 20,
      search,
      isActive,
      parentId,
      companyId,
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

    if (parentId) {
      filteredItems = filteredItems.filter((item) =>
        item.parentId?.equals(parentId),
      );
    }

    if (companyId) {
      filteredItems = filteredItems.filter((item) =>
        item.companyId.equals(companyId),
      );
    }

    const total = filteredItems.length;
    const start = (page - 1) * perPage;
    const departments = filteredItems.slice(start, start + perPage);

    return { departments, total };
  }

  async findManyByParent(
    parentId: UniqueEntityID,
    tenantId: string,
  ): Promise<Department[]> {
    return this.items.filter(
      (item) =>
        item.parentId?.equals(parentId) &&
        item.tenantId.toString() === tenantId &&
        !item.deletedAt,
    );
  }

  async findManyByManager(
    managerId: UniqueEntityID,
    tenantId: string,
  ): Promise<Department[]> {
    return this.items.filter(
      (item) =>
        item.managerId?.equals(managerId) &&
        item.tenantId.toString() === tenantId &&
        !item.deletedAt,
    );
  }

  async findManyByCompany(
    companyId: UniqueEntityID,
    tenantId: string,
  ): Promise<Department[]> {
    return this.items.filter(
      (item) =>
        item.companyId.equals(companyId) &&
        item.tenantId.toString() === tenantId &&
        !item.deletedAt,
    );
  }

  async findManyActive(tenantId: string): Promise<Department[]> {
    return this.items.filter(
      (item) =>
        item.isActive &&
        item.tenantId.toString() === tenantId &&
        !item.deletedAt,
    );
  }

  async hasChildren(id: UniqueEntityID): Promise<boolean> {
    return this.items.some(
      (item) => item.parentId?.equals(id) && !item.deletedAt,
    );
  }

  async hasEmployees(id: UniqueEntityID): Promise<boolean> {
    // In real implementation, this would check the employees repository
    // For in-memory testing, we return false by default
    void id;
    return false;
  }

  async update(data: UpdateDepartmentSchema): Promise<Department | null> {
    const index = this.items.findIndex(
      (item) => item.id.equals(data.id) && !item.deletedAt,
    );

    if (index === -1) return null;

    const department = this.items[index];

    const updatedDepartment = Department.create(
      {
        tenantId: department.tenantId,
        name: data.name ?? department.name,
        code: data.code ?? department.code,
        description:
          data.description === null
            ? undefined
            : (data.description ?? department.description),
        parentId:
          data.parentId === null
            ? undefined
            : (data.parentId ?? department.parentId),
        managerId:
          data.managerId === null
            ? undefined
            : (data.managerId ?? department.managerId),
        companyId: department.companyId,
        isActive: data.isActive ?? department.isActive,
        deletedAt: department.deletedAt,
      },
      department.id,
    );

    this.items[index] = updatedDepartment;
    return updatedDepartment;
  }

  async save(department: Department): Promise<void> {
    const index = this.items.findIndex((item) => item.id.equals(department.id));

    if (index !== -1) {
      this.items[index] = department;
    } else {
      this.items.push(department);
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
