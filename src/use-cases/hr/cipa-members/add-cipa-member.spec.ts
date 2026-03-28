import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { CPF, EmployeeStatus } from '@/entities/hr/value-objects';
import { InMemoryCipaMandatesRepository } from '@/repositories/hr/in-memory/in-memory-cipa-mandates-repository';
import { InMemoryCipaMembersRepository } from '@/repositories/hr/in-memory/in-memory-cipa-members-repository';
import { InMemoryEmployeesRepository } from '@/repositories/hr/in-memory/in-memory-employees-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { AddCipaMemberUseCase } from './add-cipa-member';

let cipaMembersRepository: InMemoryCipaMembersRepository;
let cipaMandatesRepository: InMemoryCipaMandatesRepository;
let employeesRepository: InMemoryEmployeesRepository;
let sut: AddCipaMemberUseCase;

const TENANT_ID = 'tenant-01';

async function createTestEmployee(tenantId: string): Promise<string> {
  const employee = await employeesRepository.create({
    tenantId,
    registrationNumber: `REG-${new UniqueEntityID().toString().slice(0, 8)}`,
    fullName: 'João da Silva',
    cpf: CPF.create('529.982.247-25'),
    status: EmployeeStatus.create('ACTIVE'),
    hireDate: new Date('2020-01-15'),
    baseSalary: 5000,
  });
  return employee.id.toString();
}

describe('AddCipaMemberUseCase', () => {
  beforeEach(() => {
    cipaMembersRepository = new InMemoryCipaMembersRepository();
    cipaMandatesRepository = new InMemoryCipaMandatesRepository();
    employeesRepository = new InMemoryEmployeesRepository();
    sut = new AddCipaMemberUseCase(
      cipaMembersRepository,
      cipaMandatesRepository,
      employeesRepository,
    );
  });

  it('should add an employer-appointed member to a CIPA mandate', async () => {
    const mandate = await cipaMandatesRepository.create({
      tenantId: TENANT_ID,
      name: 'CIPA 2026/2027',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2027-01-01'),
      status: 'ACTIVE',
    });

    const employeeId = await createTestEmployee(TENANT_ID);

    const { cipaMember } = await sut.execute({
      tenantId: TENANT_ID,
      mandateId: mandate.id.toString(),
      employeeId,
      role: 'PRESIDENTE',
      type: 'EMPREGADOR',
    });

    expect(cipaMember).toBeDefined();
    expect(cipaMember.role).toBe('PRESIDENTE');
    expect(cipaMember.type).toBe('EMPREGADOR');
    expect(cipaMember.mandateId.equals(mandate.id)).toBe(true);
    expect(cipaMember.employeeId.toString()).toBe(employeeId);
    expect(cipaMember.isStable).toBe(false);
    expect(cipaMember.stableUntil).toBeUndefined();
  });

  it('should add an elected employee member with job stability', async () => {
    const mandateEndDate = new Date('2027-01-01');

    const mandate = await cipaMandatesRepository.create({
      tenantId: TENANT_ID,
      name: 'CIPA 2026/2027',
      startDate: new Date('2026-01-01'),
      endDate: mandateEndDate,
      status: 'ACTIVE',
    });

    const employeeId = await createTestEmployee(TENANT_ID);

    const { cipaMember } = await sut.execute({
      tenantId: TENANT_ID,
      mandateId: mandate.id.toString(),
      employeeId,
      role: 'VICE_PRESIDENTE',
      type: 'EMPREGADO',
    });

    expect(cipaMember.isStable).toBe(true);
    expect(cipaMember.stableUntil).toBeDefined();

    // Stability should be mandate end + 1 year
    const expectedStableUntil = new Date(mandateEndDate);
    expectedStableUntil.setFullYear(expectedStableUntil.getFullYear() + 1);
    expect(cipaMember.stableUntil).toEqual(expectedStableUntil);
  });

  it('should throw ResourceNotFoundError when mandate does not exist', async () => {
    const employeeId = await createTestEmployee(TENANT_ID);
    const nonExistentMandateId = new UniqueEntityID().toString();

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        mandateId: nonExistentMandateId,
        employeeId,
        role: 'MEMBRO_TITULAR',
        type: 'EMPREGADO',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw ResourceNotFoundError when employee does not exist', async () => {
    const mandate = await cipaMandatesRepository.create({
      tenantId: TENANT_ID,
      name: 'CIPA 2026/2027',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2027-01-01'),
      status: 'ACTIVE',
    });

    const nonExistentEmployeeId = new UniqueEntityID().toString();

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        mandateId: mandate.id.toString(),
        employeeId: nonExistentEmployeeId,
        role: 'MEMBRO_TITULAR',
        type: 'EMPREGADO',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw BadRequestError when employee is already a member of the mandate', async () => {
    const mandate = await cipaMandatesRepository.create({
      tenantId: TENANT_ID,
      name: 'CIPA 2026/2027',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2027-01-01'),
      status: 'ACTIVE',
    });

    const employeeId = await createTestEmployee(TENANT_ID);

    await sut.execute({
      tenantId: TENANT_ID,
      mandateId: mandate.id.toString(),
      employeeId,
      role: 'MEMBRO_TITULAR',
      type: 'EMPREGADO',
    });

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        mandateId: mandate.id.toString(),
        employeeId,
        role: 'SECRETARIO',
        type: 'EMPREGADO',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should allow the same employee in different mandates', async () => {
    const firstMandate = await cipaMandatesRepository.create({
      tenantId: TENANT_ID,
      name: 'CIPA 2024/2025',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2025-01-01'),
      status: 'EXPIRED',
    });

    const secondMandate = await cipaMandatesRepository.create({
      tenantId: TENANT_ID,
      name: 'CIPA 2026/2027',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2027-01-01'),
      status: 'ACTIVE',
    });

    const employeeId = await createTestEmployee(TENANT_ID);

    const { cipaMember: firstMember } = await sut.execute({
      tenantId: TENANT_ID,
      mandateId: firstMandate.id.toString(),
      employeeId,
      role: 'MEMBRO_TITULAR',
      type: 'EMPREGADO',
    });

    const { cipaMember: secondMember } = await sut.execute({
      tenantId: TENANT_ID,
      mandateId: secondMandate.id.toString(),
      employeeId,
      role: 'PRESIDENTE',
      type: 'EMPREGADO',
    });

    expect(firstMember.mandateId.equals(firstMandate.id)).toBe(true);
    expect(secondMember.mandateId.equals(secondMandate.id)).toBe(true);
  });

  it('should throw ResourceNotFoundError when mandate belongs to another tenant', async () => {
    const mandate = await cipaMandatesRepository.create({
      tenantId: 'another-tenant',
      name: 'CIPA Outro Tenant',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2027-01-01'),
      status: 'ACTIVE',
    });

    const employeeId = await createTestEmployee(TENANT_ID);

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        mandateId: mandate.id.toString(),
        employeeId,
        role: 'MEMBRO_TITULAR',
        type: 'EMPREGADO',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should add member with MEMBRO_SUPLENTE role', async () => {
    const mandate = await cipaMandatesRepository.create({
      tenantId: TENANT_ID,
      name: 'CIPA 2026/2027',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2027-01-01'),
      status: 'ACTIVE',
    });

    const employeeId = await createTestEmployee(TENANT_ID);

    const { cipaMember } = await sut.execute({
      tenantId: TENANT_ID,
      mandateId: mandate.id.toString(),
      employeeId,
      role: 'MEMBRO_SUPLENTE',
      type: 'EMPREGADO',
    });

    expect(cipaMember.role).toBe('MEMBRO_SUPLENTE');
    expect(cipaMember.isStable).toBe(true);
  });
});
