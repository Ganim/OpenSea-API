import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { EmployeeDependant as PrismaDependant } from '@prisma/generated/client.js';

export function mapDependantPrismaToDomain(dependant: PrismaDependant) {
  return {
    tenantId: new UniqueEntityID(dependant.tenantId),
    employeeId: new UniqueEntityID(dependant.employeeId),
    name: dependant.name,
    cpf: dependant.cpf ?? undefined,
    cpfHash: dependant.cpfHash ?? undefined,
    birthDate: dependant.birthDate,
    relationship: dependant.relationship as
      | 'SPOUSE'
      | 'CHILD'
      | 'STEPCHILD'
      | 'PARENT'
      | 'OTHER',
    isIrrfDependant: dependant.isIrrfDependant,
    isSalarioFamilia: dependant.isSalarioFamilia,
    hasDisability: dependant.hasDisability,
    createdAt: dependant.createdAt,
    updatedAt: dependant.updatedAt,
  };
}
