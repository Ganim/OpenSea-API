import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { EmployeeDependant } from '@/entities/hr/employee-dependant';
import type {
  CreateDependantSchema,
  DependantsRepository,
  FindDependantFilters,
  UpdateDependantSchema,
} from '../dependants-repository';

export class InMemoryDependantsRepository implements DependantsRepository {
  public items: EmployeeDependant[] = [];

  async create(data: CreateDependantSchema): Promise<EmployeeDependant> {
    const dependant = EmployeeDependant.create(
      {
        tenantId: new UniqueEntityID(data.tenantId),
        employeeId: data.employeeId,
        name: data.name,
        cpf: data.cpf,
        cpfHash: data.cpfHash,
        birthDate: data.birthDate,
        relationship: data.relationship as EmployeeDependant['relationship'],
        isIrrfDependant: data.isIrrfDependant,
        isSalarioFamilia: data.isSalarioFamilia,
        hasDisability: data.hasDisability,
      },
      new UniqueEntityID(),
    );

    this.items.push(dependant);
    return dependant;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<EmployeeDependant | null> {
    return (
      this.items.find(
        (item) => item.id.equals(id) && item.tenantId.toString() === tenantId,
      ) ?? null
    );
  }

  async findByEmployeeId(
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<EmployeeDependant[]> {
    return this.items.filter(
      (item) =>
        item.employeeId.equals(employeeId) &&
        item.tenantId.toString() === tenantId,
    );
  }

  async findMany(
    tenantId: string,
    filters?: FindDependantFilters,
  ): Promise<EmployeeDependant[]> {
    let filtered = this.items.filter(
      (item) => item.tenantId.toString() === tenantId,
    );

    if (filters?.employeeId) {
      filtered = filtered.filter((item) =>
        item.employeeId.equals(filters.employeeId!),
      );
    }

    const page = filters?.page ?? 1;
    const perPage = filters?.perPage ?? 20;
    const skip = (page - 1) * perPage;

    return filtered.slice(skip, skip + perPage);
  }

  async update(data: UpdateDependantSchema): Promise<EmployeeDependant | null> {
    const index = this.items.findIndex((item) => item.id.equals(data.id));
    if (index < 0) return null;

    const existing = this.items[index];

    const updated = EmployeeDependant.create(
      {
        tenantId: existing.tenantId,
        employeeId: existing.employeeId,
        name: data.name ?? existing.name,
        cpf: data.cpf ?? existing.cpf,
        cpfHash: data.cpfHash ?? existing.cpfHash,
        birthDate: data.birthDate ?? existing.birthDate,
        relationship: (data.relationship ??
          existing.relationship) as EmployeeDependant['relationship'],
        isIrrfDependant: data.isIrrfDependant ?? existing.isIrrfDependant,
        isSalarioFamilia: data.isSalarioFamilia ?? existing.isSalarioFamilia,
        hasDisability: data.hasDisability ?? existing.hasDisability,
        createdAt: existing.createdAt,
      },
      existing.id,
    );

    this.items[index] = updated;
    return updated;
  }

  async delete(id: UniqueEntityID): Promise<void> {
    this.items = this.items.filter((item) => !item.id.equals(id));
  }
}
