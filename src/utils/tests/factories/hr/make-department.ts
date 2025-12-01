import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Department } from '@/entities/hr/department';
import { faker } from '@faker-js/faker';

interface MakeDepartmentProps {
  name?: string;
  code?: string;
  description?: string;
  parentId?: UniqueEntityID;
  managerId?: UniqueEntityID;
  isActive?: boolean;
  deletedAt?: Date;
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
 * Cria uma entidade Department para testes unitários
 */
export function makeDepartment(override: MakeDepartmentProps = {}): Department {
  const department = Department.create(
    {
      name: override.name ?? faker.commerce.department(),
      code: override.code ?? generateDepartmentCode(),
      description: override.description ?? faker.lorem.sentence(),
      parentId: override.parentId,
      managerId: override.managerId,
      isActive: override.isActive ?? true,
      deletedAt: override.deletedAt,
    },
    new UniqueEntityID(),
  );

  return department;
}
