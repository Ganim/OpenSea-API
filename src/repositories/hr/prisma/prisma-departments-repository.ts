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
        tenantId: data.tenantId,
        name: data.name,
        code: data.code,
        description: data.description,
        parentId: data.parentId?.toString(),
        managerId: data.managerId?.toString(),
        companyId: data.companyId.toString(),
        isActive: data.isActive ?? true,
      },
      include: {
        parent: true,
        manager: true,
        company: true,
      },
    });

    const department = Department.create(
      mapDepartmentPrismaToDomain(departmentData),
      new UniqueEntityID(departmentData.id),
    );
    return department;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<Department | null> {
    const departmentData = await prisma.department.findFirst({
      where: {
        id: id.toString(),
        tenantId,
        deletedAt: null,
      },
      include: {
        parent: true,
        manager: true,
        company: true,
      },
    });

    if (!departmentData) return null;

    const department = Department.create(
      mapDepartmentPrismaToDomain(departmentData),
      new UniqueEntityID(departmentData.id),
    );
    return department;
  }

  async findByCode(
    code: string,
    companyId: UniqueEntityID,
    tenantId: string,
  ): Promise<Department | null> {
    const departmentData = await prisma.department.findFirst({
      where: {
        code,
        companyId: companyId.toString(),
        tenantId,
        deletedAt: null,
      },
      include: {
        parent: true,
        manager: true,
        company: true,
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
    const {
      tenantId,
      page = 1,
      perPage = 20,
      search,
      isActive,
      parentId,
      companyId,
    } = params;

    const where = {
      tenantId,
      deletedAt: null,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { code: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
      ...(isActive !== undefined && { isActive }),
      ...(parentId && { parentId: parentId.toString() }),
      ...(companyId && { companyId: companyId.toString() }),
    };

    const [departments, total] = await Promise.all([
      prisma.department.findMany({
        where,
        include: {
          parent: true,
          manager: true,
          company: true,
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

  async findManyByParent(
    parentId: UniqueEntityID,
    tenantId: string,
  ): Promise<Department[]> {
    const departments = await prisma.department.findMany({
      where: {
        parentId: parentId.toString(),
        tenantId,
        deletedAt: null,
      },
      include: {
        parent: true,
        manager: true,
        company: true,
      },
    });

    return departments.map((dep) =>
      Department.create(
        mapDepartmentPrismaToDomain(dep),
        new UniqueEntityID(dep.id),
      ),
    );
  }

  async findManyByManager(
    managerId: UniqueEntityID,
    tenantId: string,
  ): Promise<Department[]> {
    const departments = await prisma.department.findMany({
      where: {
        managerId: managerId.toString(),
        tenantId,
        deletedAt: null,
      },
      include: {
        parent: true,
        manager: true,
        company: true,
      },
    });

    return departments.map((dep) =>
      Department.create(
        mapDepartmentPrismaToDomain(dep),
        new UniqueEntityID(dep.id),
      ),
    );
  }

  async findManyByCompany(
    companyId: UniqueEntityID,
    tenantId: string,
  ): Promise<Department[]> {
    const departments = await prisma.department.findMany({
      where: {
        companyId: companyId.toString(),
        tenantId,
        deletedAt: null,
      },
      include: {
        parent: true,
        manager: true,
        company: true,
      },
    });

    return departments.map((dep) =>
      Department.create(
        mapDepartmentPrismaToDomain(dep),
        new UniqueEntityID(dep.id),
      ),
    );
  }

  async findManyActive(tenantId: string): Promise<Department[]> {
    const departments = await prisma.department.findMany({
      where: {
        isActive: true,
        tenantId,
        deletedAt: null,
      },
      include: {
        parent: true,
        manager: true,
        company: true,
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
        company: true,
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
        companyId: department.companyId.toString(),
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
