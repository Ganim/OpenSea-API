import type { EmployeeDependant } from '@/entities/hr/employee-dependant';

export interface DependantDTO {
  id: string;
  employeeId: string;
  name: string;
  cpf: string | null;
  birthDate: string;
  relationship: string;
  isIrrfDependant: boolean;
  isSalarioFamilia: boolean;
  hasDisability: boolean;
  createdAt: string;
  updatedAt: string;
}

export function dependantToDTO(dependant: EmployeeDependant): DependantDTO {
  return {
    id: dependant.id.toString(),
    employeeId: dependant.employeeId.toString(),
    name: dependant.name,
    cpf: dependant.cpf ?? null,
    birthDate: dependant.birthDate.toISOString(),
    relationship: dependant.relationship,
    isIrrfDependant: dependant.isIrrfDependant,
    isSalarioFamilia: dependant.isSalarioFamilia,
    hasDisability: dependant.hasDisability,
    createdAt: dependant.createdAt.toISOString(),
    updatedAt: dependant.updatedAt.toISOString(),
  };
}
