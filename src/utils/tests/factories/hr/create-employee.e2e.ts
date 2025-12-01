import { prisma } from '@/lib/prisma';
import { faker } from '@faker-js/faker';
import type { ContractType, EmployeeStatus, WorkRegime } from '@prisma/client';

interface CreateEmployeeE2EProps {
  registrationNumber?: string;
  userId?: string;
  fullName?: string;
  cpf?: string;
  pis?: string;
  email?: string;
  hireDate?: Date;
  baseSalary?: number;
  contractType?: ContractType;
  workRegime?: WorkRegime;
  weeklyHours?: number;
  status?: EmployeeStatus;
  departmentId?: string;
  positionId?: string;
}

/**
 * Gera um CPF válido aleatoriamente
 */
export function generateValidCPF(): string {
  const n1 = Math.floor(Math.random() * 10);
  const n2 = Math.floor(Math.random() * 10);
  const n3 = Math.floor(Math.random() * 10);
  const n4 = Math.floor(Math.random() * 10);
  const n5 = Math.floor(Math.random() * 10);
  const n6 = Math.floor(Math.random() * 10);
  const n7 = Math.floor(Math.random() * 10);
  const n8 = Math.floor(Math.random() * 10);
  const n9 = Math.floor(Math.random() * 10);

  let d1 =
    n9 * 2 +
    n8 * 3 +
    n7 * 4 +
    n6 * 5 +
    n5 * 6 +
    n4 * 7 +
    n3 * 8 +
    n2 * 9 +
    n1 * 10;
  d1 = 11 - (d1 % 11);
  if (d1 >= 10) d1 = 0;

  let d2 =
    d1 * 2 +
    n9 * 3 +
    n8 * 4 +
    n7 * 5 +
    n6 * 6 +
    n5 * 7 +
    n4 * 8 +
    n3 * 9 +
    n2 * 10 +
    n1 * 11;
  d2 = 11 - (d2 % 11);
  if (d2 >= 10) d2 = 0;

  return `${n1}${n2}${n3}${n4}${n5}${n6}${n7}${n8}${n9}${d1}${d2}`;
}

/**
 * Gera um PIS válido aleatoriamente
 */
export function generateValidPIS(): string {
  const digits = Array.from({ length: 10 }, () =>
    Math.floor(Math.random() * 10),
  );
  const weights = [3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  let sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += digits[i] * weights[i];
  }

  const remainder = sum % 11;
  const checkDigit = remainder < 2 ? 0 : 11 - remainder;

  return `${digits.join('')}${checkDigit}`;
}

/**
 * Gera um número de matrícula único
 */
export function generateRegistrationNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `EMP-${timestamp}-${random}`;
}

/**
 * Cria um funcionário no banco de dados para testes E2E
 */
export async function createEmployeeE2E(override: CreateEmployeeE2EProps = {}) {
  const cpf = override.cpf ?? generateValidCPF();
  const registrationNumber =
    override.registrationNumber ?? generateRegistrationNumber();

  const employee = await prisma.employee.create({
    data: {
      registrationNumber,
      userId: override.userId,
      fullName: override.fullName ?? faker.person.fullName(),
      cpf,
      pis: override.pis ?? generateValidPIS(),
      email: override.email ?? faker.internet.email(),
      personalEmail: faker.internet.email(),
      phone: '11999999999',
      mobilePhone: '11988888888',
      emergencyContact: faker.person.fullName(),
      emergencyPhone: '11977777777',
      birthDate: faker.date.birthdate({ min: 18, max: 65, mode: 'age' }),
      gender: faker.helpers.arrayElement(['M', 'F']),
      maritalStatus: faker.helpers.arrayElement(['Solteiro(a)', 'Casado(a)']),
      nationality: 'Brasileiro(a)',
      birthPlace: faker.location.city(),
      address: faker.location.streetAddress(),
      addressNumber: faker.number.int({ min: 1, max: 9999 }).toString(),
      neighborhood: faker.location.county(),
      city: faker.location.city(),
      state: 'SP',
      zipCode: '01310-100',
      country: 'Brasil',
      bankCode: faker.helpers.arrayElement(['001', '237', '341']),
      bankName: faker.helpers.arrayElement([
        'Banco do Brasil',
        'Bradesco',
        'Itaú',
      ]),
      bankAgency: faker.string.numeric(4),
      bankAccount: faker.string.numeric(6),
      bankAccountType: faker.helpers.arrayElement(['Corrente', 'Poupança']),
      pixKey: faker.internet.email(),
      departmentId: override.departmentId,
      positionId: override.positionId,
      hireDate: override.hireDate ?? faker.date.past({ years: 2 }),
      status: override.status ?? 'ACTIVE',
      baseSalary:
        override.baseSalary ??
        faker.number.float({ min: 2000, max: 10000, fractionDigits: 2 }),
      contractType: override.contractType ?? 'CLT',
      workRegime: override.workRegime ?? 'FULL_TIME',
      weeklyHours: override.weeklyHours ?? 44,
      metadata: {},
    },
  });

  return {
    employee,
    employeeId: employee.id,
    cpf,
    registrationNumber,
  };
}

/**
 * Gera dados para criação de funcionário via API
 */
export function generateEmployeeData(
  override: Partial<CreateEmployeeE2EProps> = {},
) {
  return {
    registrationNumber:
      override.registrationNumber ?? generateRegistrationNumber(),
    fullName: override.fullName ?? faker.person.fullName(),
    cpf: override.cpf ?? generateValidCPF(),
    hireDate: (override.hireDate ?? new Date()).toISOString(),
    baseSalary:
      override.baseSalary ??
      faker.number.float({ min: 2000, max: 10000, fractionDigits: 2 }),
    contractType: override.contractType ?? 'CLT',
    workRegime: override.workRegime ?? 'FULL_TIME',
    weeklyHours: override.weeklyHours ?? 44,
    country: 'Brasil',
    email: override.email ?? faker.internet.email(),
    phone: '11999999999',
    mobilePhone: '11988888888',
    address: faker.location.streetAddress().substring(0, 100),
    addressNumber: faker.number.int({ min: 1, max: 9999 }).toString(),
    neighborhood: faker.location.county().substring(0, 50),
    city: faker.location.city().substring(0, 50),
    state: 'SP',
    zipCode: '01310-100',
  };
}
