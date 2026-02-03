import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Position } from '@/entities/hr/position';
import { faker } from '@faker-js/faker';

interface MakePositionProps {
  tenantId?: UniqueEntityID;
  name?: string;
  code?: string;
  description?: string;
  departmentId?: UniqueEntityID;
  level?: number;
  minSalary?: number;
  maxSalary?: number;
  isActive?: boolean;
  deletedAt?: Date;
}

/**
 * Gera um código de cargo único
 */
export function generatePositionCode(): string {
  const prefix = faker.helpers.arrayElement([
    'POS',
    'JOB',
    'ROLE',
    'CAR',
    'FUNC',
  ]);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${random}`;
}

/**
 * Cria uma entidade Position para testes unitários
 */
export function makePosition(override: MakePositionProps = {}): Position {
  const minSalary =
    override.minSalary ??
    faker.number.float({ min: 1500, max: 5000, fractionDigits: 2 });
  const maxSalary =
    override.maxSalary ??
    faker.number.float({
      min: minSalary + 1000,
      max: 15000,
      fractionDigits: 2,
    });

  const position = Position.create(
    {
      tenantId: override.tenantId ?? new UniqueEntityID(),
      name: override.name ?? faker.person.jobTitle(),
      code: override.code ?? generatePositionCode(),
      description: override.description ?? faker.lorem.sentence(),
      departmentId: override.departmentId,
      level: override.level ?? faker.number.int({ min: 1, max: 10 }),
      minSalary,
      maxSalary,
      isActive: override.isActive ?? true,
      deletedAt: override.deletedAt,
    },
    new UniqueEntityID(),
  );

  return position;
}
