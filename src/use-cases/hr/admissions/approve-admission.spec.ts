import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock fire-and-forget dynamic imports that cause unhandled rejections after teardown
vi.mock('@/services/esocial/auto-generate', () => ({
  tryAutoGenerateEvent: vi.fn().mockResolvedValue(undefined),
}));

vi.mock(
  '@/use-cases/hr/onboarding/factories/make-create-onboarding-checklist-use-case',
  () => ({
    makeCreateOnboardingChecklistUseCase: () => ({
      execute: vi.fn().mockResolvedValue({}),
    }),
  }),
);

import { InMemoryAdmissionsRepository } from '@/repositories/hr/in-memory/in-memory-admissions-repository';
import { InMemoryEmployeesRepository } from '@/repositories/hr/in-memory/in-memory-employees-repository';
import { ApproveAdmissionUseCase } from './approve-admission';

let admissionsRepository: InMemoryAdmissionsRepository;
let employeesRepository: InMemoryEmployeesRepository;
let sut: ApproveAdmissionUseCase;
const tenantId = 'tenant-123';

describe('Approve Admission Use Case', () => {
  beforeEach(() => {
    admissionsRepository = new InMemoryAdmissionsRepository();
    employeesRepository = new InMemoryEmployeesRepository();
    sut = new ApproveAdmissionUseCase(
      admissionsRepository,
      employeesRepository,
    );
  });

  it('should approve admission and create an employee', async () => {
    // Create invite first
    const invite = await admissionsRepository.create({
      tenantId,
      fullName: 'Maria Santos',
      email: 'maria@example.com',
      salary: 5000,
      contractType: 'CLT',
      workRegime: 'FULL_TIME',
      expiresAt: new Date(Date.now() + 86400000 * 7),
    });

    // Submit candidate data with CPF
    await admissionsRepository.update({
      id: invite.id,
      candidateData: {
        cpf: '529.982.247-25',
        birthDate: '1990-05-15',
        gender: 'Feminino',
        phone: '11999998888',
        address: 'Rua das Flores, 100',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01001-000',
      },
      status: 'IN_PROGRESS',
    });

    const { invite: approvedInvite, employee } = await sut.execute({
      tenantId,
      inviteId: invite.id,
      registrationNumber: 'EMP001',
      weeklyHours: 44,
    });

    expect(approvedInvite.status).toBe('COMPLETED');
    expect(approvedInvite.completedAt).toBeDefined();
    expect(approvedInvite.employeeId).toBe(employee.id.toString());

    expect(employee).toBeDefined();
    expect(employee.fullName).toBe('Maria Santos');
    expect(employee.registrationNumber).toBe('EMP001');
    expect(employee.cpf.value).toBe('52998224725');
    expect(employee.status.value).toBe('ACTIVE');
    expect(employee.contractType.value).toBe('CLT');
    expect(employee.baseSalary).toBe(5000);
  });

  it('should throw if invite is not found', async () => {
    await expect(
      sut.execute({
        tenantId,
        inviteId: 'non-existent-id',
        registrationNumber: 'EMP001',
      }),
    ).rejects.toThrow('Admission invite not found');
  });

  it('should throw if invite is already completed', async () => {
    const invite = await admissionsRepository.create({
      tenantId,
      fullName: 'João Silva',
      email: 'joao@example.com',
    });

    await admissionsRepository.update({
      id: invite.id,
      status: 'COMPLETED',
    });

    await expect(
      sut.execute({
        tenantId,
        inviteId: invite.id,
        registrationNumber: 'EMP001',
      }),
    ).rejects.toThrow('This admission is already completed');
  });

  it('should throw if invite is cancelled', async () => {
    const invite = await admissionsRepository.create({
      tenantId,
      fullName: 'João Silva',
      email: 'joao@example.com',
    });

    await admissionsRepository.update({
      id: invite.id,
      status: 'CANCELLED',
    });

    await expect(
      sut.execute({
        tenantId,
        inviteId: invite.id,
        registrationNumber: 'EMP001',
      }),
    ).rejects.toThrow('Cannot approve a cancelled admission');
  });

  it('should throw if candidate data has no CPF', async () => {
    const invite = await admissionsRepository.create({
      tenantId,
      fullName: 'João Silva',
      email: 'joao@example.com',
    });

    await admissionsRepository.update({
      id: invite.id,
      candidateData: { gender: 'Masculino' },
      status: 'IN_PROGRESS',
    });

    await expect(
      sut.execute({
        tenantId,
        inviteId: invite.id,
        registrationNumber: 'EMP001',
      }),
    ).rejects.toThrow('Candidate data must include CPF before approval');
  });

  it('should use default weeklyHours of 44 when not provided', async () => {
    const invite = await admissionsRepository.create({
      tenantId,
      fullName: 'Ana Costa',
      email: 'ana@example.com',
      contractType: 'CLT',
      workRegime: 'FULL_TIME',
    });

    await admissionsRepository.update({
      id: invite.id,
      candidateData: { cpf: '529.982.247-25' },
      status: 'IN_PROGRESS',
    });

    const { employee } = await sut.execute({
      tenantId,
      inviteId: invite.id,
      registrationNumber: 'EMP002',
    });

    expect(employee.weeklyHours).toBe(44);
  });
});
