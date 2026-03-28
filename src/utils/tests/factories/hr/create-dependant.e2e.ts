import { prisma } from '@/lib/prisma';
import { faker } from '@faker-js/faker';

interface CreateDependantE2EProps {
  tenantId: string;
  employeeId: string;
  name?: string;
  cpf?: string;
  birthDate?: Date;
  relationship?: string;
  isIrrfDependant?: boolean;
  isSalarioFamilia?: boolean;
  hasDisability?: boolean;
}

/**
 * Creates a dependant directly in the database for E2E tests
 */
export async function createDependantE2E(props: CreateDependantE2EProps) {
  const dependant = await prisma.employeeDependant.create({
    data: {
      tenantId: props.tenantId,
      employeeId: props.employeeId,
      name: props.name ?? faker.person.fullName(),
      cpf: props.cpf ?? null,
      birthDate:
        props.birthDate ??
        faker.date.birthdate({ min: 1, max: 17, mode: 'age' }),
      relationship: props.relationship ?? 'CHILD',
      isIrrfDependant: props.isIrrfDependant ?? false,
      isSalarioFamilia: props.isSalarioFamilia ?? false,
      hasDisability: props.hasDisability ?? false,
    },
  });

  return {
    dependant,
    dependantId: dependant.id,
  };
}

/**
 * Generates dependant data for API requests
 */
export function generateDependantData(
  override?: Partial<CreateDependantE2EProps>,
) {
  return {
    name: override?.name ?? faker.person.fullName(),
    birthDate: (
      override?.birthDate ??
      faker.date.birthdate({ min: 1, max: 17, mode: 'age' })
    ).toISOString(),
    relationship: override?.relationship ?? 'CHILD',
    isIrrfDependant: override?.isIrrfDependant ?? false,
    isSalarioFamilia: override?.isSalarioFamilia ?? false,
    hasDisability: override?.hasDisability ?? false,
  };
}
