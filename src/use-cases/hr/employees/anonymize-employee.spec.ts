import { createHash } from 'node:crypto';
import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  ContractType,
  CPF,
  EmployeeStatus,
  WorkRegime,
} from '@/entities/hr/value-objects';
import { ANONYMIZED_CPF_PREFIX } from '@/entities/hr/value-objects/cpf';
import { InMemoryEmployeesRepository } from '@/repositories/hr/in-memory/in-memory-employees-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  ANONYMIZE_EMPLOYEE_CONFIRMATION,
  AnonymizeEmployeeUseCase,
} from './anonymize-employee';

let employeesRepository: InMemoryEmployeesRepository;
let sut: AnonymizeEmployeeUseCase;
const tenantId = new UniqueEntityID().toString();
const actorUserId = new UniqueEntityID().toString();
const VALID_CPF = '52998224725';

async function createSampleEmployee() {
  return employeesRepository.create({
    tenantId,
    registrationNumber: 'EMP-001',
    fullName: 'Maria de Souza',
    socialName: 'Maria S.',
    email: 'maria.souza@example.com',
    personalEmail: 'maria@personal.com',
    phone: '11999990001',
    mobilePhone: '11988887777',
    address: 'Rua das Flores, 100',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01000-000',
    bankCode: '341',
    bankName: 'Itaú',
    bankAgency: '0001',
    bankAccount: '12345-6',
    pixKey: 'maria@pix.com',
    cpf: CPF.create(VALID_CPF),
    hireDate: new Date('2020-03-01'),
    status: EmployeeStatus.ACTIVE(),
    baseSalary: 4500,
    contractType: ContractType.CLT(),
    workRegime: WorkRegime.FULL_TIME(),
    weeklyHours: 44,
    country: 'Brasil',
    metadata: { hobby: 'painting' },
  });
}

describe('Anonymize Employee Use Case', () => {
  beforeEach(() => {
    employeesRepository = new InMemoryEmployeesRepository();
    sut = new AnonymizeEmployeeUseCase(employeesRepository);
  });

  it('anonymizes every PII field and preserves the row', async () => {
    const sampleEmployee = await createSampleEmployee();

    const { employee: anonymizedEmployee } = await sut.execute({
      tenantId,
      employeeId: sampleEmployee.id.toString(),
      actorUserId,
      confirmation: ANONYMIZE_EMPLOYEE_CONFIRMATION,
    });

    expect(anonymizedEmployee.fullName).toBe('REDACTED REDACTED');
    expect(anonymizedEmployee.socialName).toBeUndefined();
    expect(anonymizedEmployee.email).toBeUndefined();
    expect(anonymizedEmployee.personalEmail).toBeUndefined();
    expect(anonymizedEmployee.phone).toBeUndefined();
    expect(anonymizedEmployee.mobilePhone).toBeUndefined();
    expect(anonymizedEmployee.address).toBeUndefined();
    expect(anonymizedEmployee.city).toBeUndefined();
    expect(anonymizedEmployee.state).toBeUndefined();
    expect(anonymizedEmployee.zipCode).toBeUndefined();
    expect(anonymizedEmployee.bankAccount).toBeUndefined();
    expect(anonymizedEmployee.bankAgency).toBeUndefined();
    expect(anonymizedEmployee.pixKey).toBeUndefined();
    expect(anonymizedEmployee.deletedAt).toBeInstanceOf(Date);
  });

  it('replaces the CPF with the hashed anonymized prefix', async () => {
    const sampleEmployee = await createSampleEmployee();

    const expectedHash = createHash('sha256').update(VALID_CPF).digest('hex');

    const { employee: anonymizedEmployee } = await sut.execute({
      tenantId,
      employeeId: sampleEmployee.id.toString(),
      actorUserId,
      confirmation: ANONYMIZE_EMPLOYEE_CONFIRMATION,
    });

    expect(anonymizedEmployee.cpf.value).toBe(
      `${ANONYMIZED_CPF_PREFIX}${expectedHash}`,
    );
    expect(anonymizedEmployee.cpf.isAnonymized).toBe(true);
  });

  it('records anonymization metadata for audit traceability', async () => {
    const sampleEmployee = await createSampleEmployee();

    const { employee: anonymizedEmployee } = await sut.execute({
      tenantId,
      employeeId: sampleEmployee.id.toString(),
      actorUserId,
      confirmation: ANONYMIZE_EMPLOYEE_CONFIRMATION,
      reason: 'Solicitação titular',
    });

    expect(anonymizedEmployee.metadata).toMatchObject({
      anonymized: true,
      anonymizedByUserId: actorUserId,
      anonymizationReason: 'Solicitação titular',
    });
    expect(anonymizedEmployee.metadata.anonymizedAt).toEqual(
      expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
    );
  });

  it('keeps fiscal-relevant data intact (registration, hire date, salary)', async () => {
    const sampleEmployee = await createSampleEmployee();

    const { employee: anonymizedEmployee } = await sut.execute({
      tenantId,
      employeeId: sampleEmployee.id.toString(),
      actorUserId,
      confirmation: ANONYMIZE_EMPLOYEE_CONFIRMATION,
    });

    expect(anonymizedEmployee.registrationNumber).toBe('EMP-001');
    expect(anonymizedEmployee.hireDate).toEqual(new Date('2020-03-01'));
    expect(anonymizedEmployee.baseSalary).toBe(4500);
    expect(anonymizedEmployee.contractType.value).toBe('CLT');
    expect(anonymizedEmployee.weeklyHours).toBe(44);
  });

  it('rejects when confirmation does not match the expected text', async () => {
    const sampleEmployee = await createSampleEmployee();

    await expect(
      sut.execute({
        tenantId,
        employeeId: sampleEmployee.id.toString(),
        actorUserId,
        confirmation: 'CONFIRMAR',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('rejects when employee does not exist', async () => {
    await expect(
      sut.execute({
        tenantId,
        employeeId: new UniqueEntityID().toString(),
        actorUserId,
        confirmation: ANONYMIZE_EMPLOYEE_CONFIRMATION,
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('rejects when employee was already anonymized', async () => {
    const sampleEmployee = await createSampleEmployee();

    await sut.execute({
      tenantId,
      employeeId: sampleEmployee.id.toString(),
      actorUserId,
      confirmation: ANONYMIZE_EMPLOYEE_CONFIRMATION,
    });

    await expect(
      sut.execute({
        tenantId,
        employeeId: sampleEmployee.id.toString(),
        actorUserId,
        confirmation: ANONYMIZE_EMPLOYEE_CONFIRMATION,
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
