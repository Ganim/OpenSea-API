import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { EmployeeDependant } from '@/entities/hr/employee-dependant';
import { prisma } from '@/lib/prisma';
import { mapDependantPrismaToDomain } from '@/mappers/hr/dependant';
import type {
  DependantsRepository,
  CreateDependantSchema,
  FindDependantFilters,
  UpdateDependantSchema,
} from '../dependants-repository';

export class PrismaDependantsRepository implements DependantsRepository {
  async create(data: CreateDependantSchema): Promise<EmployeeDependant> {
    const record = await prisma.employeeDependant.create({
      data: {
        tenantId: data.tenantId,
        employeeId: data.employeeId.toString(),
        name: data.name,
        cpf: data.cpf,
        cpfHash: data.cpfHash,
        birthDate: data.birthDate,
        relationship: data.relationship,
        isIrrfDependant: data.isIrrfDependant,
        isSalarioFamilia: data.isSalarioFamilia,
        hasDisability: data.hasDisability,
      },
    });

    return EmployeeDependant.create(
      mapDependantPrismaToDomain(record),
      new UniqueEntityID(record.id),
    );
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<EmployeeDependant | null> {
    const record = await prisma.employeeDependant.findFirst({
      where: { id: id.toString(), tenantId },
    });

    if (!record) return null;

    return EmployeeDependant.create(
      mapDependantPrismaToDomain(record),
      new UniqueEntityID(record.id),
    );
  }

  async findByEmployeeId(
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<EmployeeDependant[]> {
    const records = await prisma.employeeDependant.findMany({
      where: {
        tenantId,
        employeeId: employeeId.toString(),
      },
      orderBy: { name: 'asc' },
    });

    return records.map((record) =>
      EmployeeDependant.create(
        mapDependantPrismaToDomain(record),
        new UniqueEntityID(record.id),
      ),
    );
  }

  async findMany(
    tenantId: string,
    filters?: FindDependantFilters,
  ): Promise<EmployeeDependant[]> {
    const page = filters?.page ?? 1;
    const perPage = Math.min(filters?.perPage ?? 50, 100);
    const skip = (page - 1) * perPage;

    const records = await prisma.employeeDependant.findMany({
      where: {
        tenantId,
        employeeId: filters?.employeeId?.toString(),
      },
      orderBy: { name: 'asc' },
      skip,
      take: perPage,
    });

    return records.map((record) =>
      EmployeeDependant.create(
        mapDependantPrismaToDomain(record),
        new UniqueEntityID(record.id),
      ),
    );
  }

  async update(data: UpdateDependantSchema): Promise<EmployeeDependant | null> {
    const existing = await prisma.employeeDependant.findUnique({
      where: { id: data.id.toString(), ...(data.tenantId && { tenantId: data.tenantId }), },
    });

    if (!existing) return null;

    const record = await prisma.employeeDependant.update({
      where: { id: data.id.toString(), ...(data.tenantId && { tenantId: data.tenantId }), },
      data: {
        name: data.name,
        cpf: data.cpf,
        cpfHash: data.cpfHash,
        birthDate: data.birthDate,
        relationship: data.relationship,
        isIrrfDependant: data.isIrrfDependant,
        isSalarioFamilia: data.isSalarioFamilia,
        hasDisability: data.hasDisability,
      },
    });

    return EmployeeDependant.create(
      mapDependantPrismaToDomain(record),
      new UniqueEntityID(record.id),
    );
  }

  async delete(id: UniqueEntityID, tenantId?: string): Promise<void> {
    await prisma.employeeDependant.delete({
      where: { id: id.toString(), ...(tenantId && { tenantId }), },
    });
  }
}
