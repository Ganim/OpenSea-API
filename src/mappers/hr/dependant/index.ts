export { mapDependantPrismaToDomain } from './dependant-prisma-to-domain';

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

export { dependantToDTO } from './dependant-to-dto';
