import { prisma } from '@/lib/prisma';
import { faker } from '@faker-js/faker';

interface CreatePositionE2EProps {
  name?: string;
  code?: string;
  description?: string;
  departmentId?: string;
  level?: number;
  minSalary?: number;
  maxSalary?: number;
  isActive?: boolean;
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
 * Cria um cargo no banco de dados para testes E2E
 */
export async function createPositionE2E(override: CreatePositionE2EProps = {}) {
  const code = override.code ?? generatePositionCode();
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

  const position = await prisma.position.create({
    data: {
      name: override.name ?? faker.person.jobTitle(),
      code,
      description: override.description ?? faker.lorem.sentence(),
      departmentId: override.departmentId,
      level: override.level ?? faker.number.int({ min: 1, max: 10 }),
      minSalary,
      maxSalary,
      isActive: override.isActive ?? true,
    },
  });

  return {
    position,
    positionId: position.id,
    code,
  };
}

/**
 * Gera dados para criação de cargo via API
 */
export function generatePositionData(
  override: Partial<CreatePositionE2EProps> = {},
) {
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

  return {
    name: override.name ?? faker.person.jobTitle(),
    code: override.code ?? generatePositionCode(),
    description: override.description ?? faker.lorem.sentence(),
    departmentId: override.departmentId,
    level: override.level ?? faker.number.int({ min: 1, max: 10 }),
    minSalary,
    maxSalary,
    isActive: override.isActive ?? true,
  };
}
