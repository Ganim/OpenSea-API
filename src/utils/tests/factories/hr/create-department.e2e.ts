import { prisma } from '@/lib/prisma';
import { faker } from '@faker-js/faker';

interface CreateDepartmentE2EProps {
  name?: string;
  code?: string;
  description?: string;
  parentId?: string;
  managerId?: string;
  isActive?: boolean;
}

/**
 * Gera um código de departamento único
 */
export function generateDepartmentCode(): string {
  const prefix = faker.helpers.arrayElement([
    'DEP',
    'DEPT',
    'DIV',
    'SEC',
    'UNIT',
  ]);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${random}`;
}

/**
 * Cria um departamento no banco de dados para testes E2E
 */
export async function createDepartmentE2E(
  override: CreateDepartmentE2EProps = {},
) {
  const code = override.code ?? generateDepartmentCode();

  const department = await prisma.department.create({
    data: {
      name: override.name ?? faker.commerce.department(),
      code,
      description: override.description ?? faker.lorem.sentence(),
      parentId: override.parentId,
      managerId: override.managerId,
      isActive: override.isActive ?? true,
    },
  });

  return {
    department,
    departmentId: department.id,
    code,
  };
}

/**
 * Gera dados para criação de departamento via API
 */
export function generateDepartmentData(
  override: Partial<CreateDepartmentE2EProps> = {},
) {
  return {
    name: override.name ?? faker.commerce.department(),
    code: override.code ?? generateDepartmentCode(),
    description: override.description ?? faker.lorem.sentence(),
    parentId: override.parentId,
    managerId: override.managerId,
    isActive: override.isActive ?? true,
  };
}
