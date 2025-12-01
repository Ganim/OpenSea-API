import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Department } from '@/entities/hr/department';
import { prisma } from '@/lib/prisma';
import { mapDepartmentPrismaToDomain } from '@/mappers/hr/department/department-prisma-to-domain';
import type {
  CreateDepartmentSchema,
  DepartmentsRepository,
  FindManyDepartmentsParams,
  FindManyDepartmentsResult,
  UpdateDepartmentSchema,
} from '../departments-repository';

export class PrismaDepartmentsRepository implements DepartmentsRepository {
  async create(data: CreateDepartmentSchema): Promise<Department> {
    const departmentData = await prisma.department.create({
      data: {
        name: data.name,
        code: data.code,
        description: data.description,
        parentId: data.parentId?.toString(),
        managerId: data.managerId?.toString(),
        isActive: data.isActive ?? true,
      },
      include: {
        parent: true,
        manager: true,
      },
    });

    const department = Department.create(
      mapDepartmentPrismaToDomain(departmentData),
      new UniqueEntityID(departmentData.id),
    );
    return department;
  }

  async findById(id: UniqueEntityID): Promise<Department | null> {
    const departmentData = await prisma.department.findFirst({
      where: {
        id: id.toString(),
        deletedAt: null,
      },
      include: {
        parent: true,
        manager: true,
      },
    });

    if (!departmentData) return null;

    const department = Department.create(
      mapDepartmentPrismaToDomain(departmentData),
      new UniqueEntityID(departmentData.id),
    );
    return department;
  }

  async findByCode(code: string): Promise<Department | null> {
    const departmentData = await prisma.department.findFirst({
      where: {
        code,
        deletedAt: null,
      },
      include: {
        parent: true,
        manager: true,
      },
    });

    if (!departmentData) return null;

    const department = Department.create(
      mapDepartmentPrismaToDomain(departmentData),
      new UniqueEntityID(departmentData.id),
    );
    return department;
  }

  async findMany(
    params: FindManyDepartmentsParams,
  ): Promise<FindManyDepartmentsResult> {
    const { page = 1, perPage = 20, search, isActive, parentId } = params;

    const where = {
      deletedAt: null,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { code: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
      ...(isActive !== undefined && { isActive }),
      ...(parentId && { parentId: parentId.toString() }),
    };

    const [departments, total] = await Promise.all([
      prisma.department.findMany({
        where,
        include: {
          parent: true,
          manager: true,
        },
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { name: 'asc' },
      }),
      prisma.department.count({ where }),
    ]);

    return {
      departments: departments.map((dep) =>
        Department.create(
          mapDepartmentPrismaToDomain(dep),
          new UniqueEntityID(dep.id),
        ),
      ),
      total,
    };
  }

  async findManyByParent(parentId: UniqueEntityID): Promise<Department[]> {
    const departments = await prisma.department.findMany({
      where: {
        parentId: parentId.toString(),
        deletedAt: null,
      },
      include: {
        parent: true,
        manager: true,
      },
    });

    return departments.map((dep) =>
      Department.create(
        mapDepartmentPrismaToDomain(dep),
        new UniqueEntityID(dep.id),
      ),
    );
  }

  async findManyByManager(managerId: UniqueEntityID): Promise<Department[]> {
    const departments = await prisma.department.findMany({
      where: {
        managerId: managerId.toString(),
        deletedAt: null,
      },
      include: {
        parent: true,
        manager: true,
      },
    });

    return departments.map((dep) =>
      Department.create(
        mapDepartmentPrismaToDomain(dep),
        new UniqueEntityID(dep.id),
      ),
    );
  }

  async findManyActive(): Promise<Department[]> {
    const departments = await prisma.department.findMany({
      where: {
        isActive: true,
        deletedAt: null,
      },
      include: {
        parent: true,
        manager: true,
      },
    });

    return departments.map((dep) =>
      Department.create(
        mapDepartmentPrismaToDomain(dep),
        new UniqueEntityID(dep.id),
      ),
    );
  }

  async hasChildren(id: UniqueEntityID): Promise<boolean> {
    const count = await prisma.department.count({
      where: {
        parentId: id.toString(),
        deletedAt: null,
      },
    });
    return count > 0;
  }

  async hasEmployees(id: UniqueEntityID): Promise<boolean> {
    const count = await prisma.employee.count({
      where: {
        departmentId: id.toString(),
        deletedAt: null,
      },
    });
    return count > 0;
  }

  async update(data: UpdateDepartmentSchema): Promise<Department | null> {
    const existing = await prisma.department.findFirst({
      where: {
        id: data.id.toString(),
        deletedAt: null,
      },
    });

    if (!existing) return null;

    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.code !== undefined) updateData.code = data.code;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.parentId !== undefined)
      updateData.parentId = data.parentId?.toString() ?? null;
    if (data.managerId !== undefined)
      updateData.managerId = data.managerId?.toString() ?? null;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const departmentData = await prisma.department.update({
      where: { id: data.id.toString() },
      data: updateData,
      include: {
        parent: true,
        manager: true,
      },
    });

    return Department.create(
      mapDepartmentPrismaToDomain(departmentData),
      new UniqueEntityID(departmentData.id),
    );
  }

  async save(department: Department): Promise<void> {
    await prisma.department.update({
      where: { id: department.id.toString() },
      data: {
        name: department.name,
        code: department.code,
        description: department.description,
        parentId: department.parentId?.toString() ?? null,
        managerId: department.managerId?.toString() ?? null,
        isActive: department.isActive,
        deletedAt: department.deletedAt,
      },
    });
  }

  async delete(id: UniqueEntityID): Promise<void> {
    await prisma.department.update({
      where: { id: id.toString() },
      data: { deletedAt: new Date(), isActive: false },
    });
  }
}
