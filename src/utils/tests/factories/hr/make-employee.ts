import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Employee } from '@/entities/hr/employee';
import {
  ContractType,
  CPF,
  EmployeeStatus,
  PIS,
  WorkRegime,
} from '@/entities/hr/value-objects';
import { faker } from '@faker-js/faker';

interface MakeEmployeeProps {
  tenantId?: UniqueEntityID;
  registrationNumber?: string;
  userId?: UniqueEntityID;
  fullName?: string;
  socialName?: string;
  birthDate?: Date;
  gender?: string;
  pcd?: boolean;
  maritalStatus?: string;
  nationality?: string;
  birthPlace?: string;
  emergencyContactInfo?: {
    name?: string;
    phone?: string;
    relationship?: string;
  };
  healthConditions?: Array<{ description: string; requiresAttention: boolean }>;
  cpf?: CPF;
  rg?: string;
  rgIssuer?: string;
  rgIssueDate?: Date;
  pis?: PIS;
  ctpsNumber?: string;
  ctpsSeries?: string;
  ctpsState?: string;
  voterTitle?: string;
  militaryDoc?: string;
  email?: string;
  personalEmail?: string;
  phone?: string;
  mobilePhone?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  bankCode?: string;
  bankName?: string;
  bankAgency?: string;
  bankAccount?: string;
  bankAccountType?: string;
  pixKey?: string;
  departmentId?: UniqueEntityID;
  positionId?: UniqueEntityID;
  supervisorId?: UniqueEntityID;
  companyId?: UniqueEntityID;
  hireDate?: Date;
  terminationDate?: Date;
  status?: EmployeeStatus;
  baseSalary?: number;
  contractType?: ContractType;
  workRegime?: WorkRegime;
  weeklyHours?: number;
  photoUrl?: string;
  metadata?: Record<string, unknown>;
  pendingIssues?: string[];
  deletedAt?: Date;
}

/**
 * Gera um CPF válido aleatoriamente
 */
export function generateValidCPF(): string {
  // Gerar 9 primeiros dígitos
  const n1 = Math.floor(Math.random() * 10);
  const n2 = Math.floor(Math.random() * 10);
  const n3 = Math.floor(Math.random() * 10);
  const n4 = Math.floor(Math.random() * 10);
  const n5 = Math.floor(Math.random() * 10);
  const n6 = Math.floor(Math.random() * 10);
  const n7 = Math.floor(Math.random() * 10);
  const n8 = Math.floor(Math.random() * 10);
  const n9 = Math.floor(Math.random() * 10);

  // Calcular primeiro dígito verificador
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

  // Calcular segundo dígito verificador
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
  // Gerar 10 primeiros dígitos
  const digits = Array.from({ length: 10 }, () =>
    Math.floor(Math.random() * 10),
  );

  // Pesos do PIS
  const weights = [3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  // Calcular dígito verificador
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

export function makeEmployee(override: MakeEmployeeProps = {}): Employee {
  const cpfString = generateValidCPF();
  const pisString = generateValidPIS();

  const employee = Employee.create(
    {
      tenantId: override.tenantId ?? new UniqueEntityID(),
      registrationNumber:
        override.registrationNumber ?? generateRegistrationNumber(),
      userId: override.userId,
      fullName: override.fullName ?? faker.person.fullName(),
      socialName: override.socialName,
      birthDate:
        override.birthDate ??
        faker.date.birthdate({ min: 18, max: 65, mode: 'age' }),
      gender: override.gender ?? faker.helpers.arrayElement(['M', 'F', 'O']),
      pcd: override.pcd ?? false,
      maritalStatus:
        override.maritalStatus ??
        faker.helpers.arrayElement([
          'Solteiro(a)',
          'Casado(a)',
          'Divorciado(a)',
          'Viúvo(a)',
        ]),
      nationality: override.nationality ?? 'Brasileiro(a)',
      birthPlace: override.birthPlace ?? faker.location.city(),
      emergencyContactInfo:
        override.emergencyContactInfo ??
        ({
          name: faker.person.fullName(),
          phone: faker.phone.number(),
          relationship: 'Parente',
        } satisfies Record<string, string>),
      healthConditions: override.healthConditions,
      cpf: override.cpf ?? CPF.create(cpfString),
      rg: override.rg ?? faker.string.numeric(9),
      rgIssuer: override.rgIssuer ?? 'SSP/SP',
      rgIssueDate: override.rgIssueDate ?? faker.date.past({ years: 10 }),
      pis: override.pis ?? PIS.create(pisString),
      ctpsNumber: override.ctpsNumber ?? faker.string.numeric(7),
      ctpsSeries: override.ctpsSeries ?? faker.string.numeric(4),
      ctpsState: override.ctpsState ?? 'SP',
      voterTitle: override.voterTitle ?? faker.string.numeric(12),
      militaryDoc: override.militaryDoc,
      email: override.email ?? faker.internet.email(),
      personalEmail: override.personalEmail ?? faker.internet.email(),
      phone: override.phone ?? faker.phone.number(),
      mobilePhone: override.mobilePhone ?? faker.phone.number(),
      emergencyContact: override.emergencyContact ?? faker.person.fullName(),
      emergencyPhone: override.emergencyPhone ?? faker.phone.number(),
      address: override.address ?? faker.location.streetAddress(),
      addressNumber:
        override.addressNumber ??
        faker.number.int({ min: 1, max: 9999 }).toString(),
      complement: override.complement,
      neighborhood: override.neighborhood ?? faker.location.county(),
      city: override.city ?? faker.location.city(),
      state: override.state ?? 'SP',
      zipCode: override.zipCode ?? faker.location.zipCode('#####-###'),
      country: override.country ?? 'Brasil',
      bankCode:
        override.bankCode ?? faker.helpers.arrayElement(['001', '237', '341']),
      bankName:
        override.bankName ??
        faker.helpers.arrayElement(['Banco do Brasil', 'Bradesco', 'Itaú']),
      bankAgency: override.bankAgency ?? faker.string.numeric(4),
      bankAccount: override.bankAccount ?? faker.string.numeric(6),
      bankAccountType:
        override.bankAccountType ??
        faker.helpers.arrayElement(['Corrente', 'Poupança']),
      pixKey: override.pixKey ?? faker.internet.email(),
      departmentId: override.departmentId,
      positionId: override.positionId,
      supervisorId: override.supervisorId,
      companyId: override.companyId,
      hireDate: override.hireDate ?? faker.date.past({ years: 5 }),
      terminationDate: override.terminationDate,
      status: override.status ?? EmployeeStatus.ACTIVE(),
      baseSalary:
        override.baseSalary ??
        faker.number.float({ min: 1500, max: 15000, fractionDigits: 2 }),
      contractType: override.contractType ?? ContractType.CLT(),
      workRegime: override.workRegime ?? WorkRegime.FULL_TIME(),
      weeklyHours: override.weeklyHours ?? 44,
      photoUrl: override.photoUrl,
      metadata: override.metadata ?? {},
      pendingIssues: override.pendingIssues ?? [],
      deletedAt: override.deletedAt,
    },
    new UniqueEntityID(),
  );

  return employee;
}
