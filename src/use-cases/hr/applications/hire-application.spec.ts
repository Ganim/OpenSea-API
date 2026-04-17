import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { CPF, EmployeeStatus } from '@/entities/hr/value-objects';
import { ContractType, WorkRegime } from '@/entities/hr/value-objects';
import { InMemoryApplicationsRepository } from '@/repositories/hr/in-memory/in-memory-applications-repository';
import { InMemoryCandidatesRepository } from '@/repositories/hr/in-memory/in-memory-candidates-repository';
import { InMemoryEmployeesRepository } from '@/repositories/hr/in-memory/in-memory-employees-repository';
import { InMemoryJobPostingsRepository } from '@/repositories/hr/in-memory/in-memory-job-postings-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { HireApplicationUseCase } from './hire-application';

let applicationsRepository: InMemoryApplicationsRepository;
let candidatesRepository: InMemoryCandidatesRepository;
let employeesRepository: InMemoryEmployeesRepository;
let jobPostingsRepository: InMemoryJobPostingsRepository;
let sut: HireApplicationUseCase;

const tenantId = new UniqueEntityID().toString();

/**
 * Seeds a candidate + job-posting pair plus the application that links them,
 * returning the repository entities. Keeps the individual specs readable by
 * centralising the boilerplate needed for the full hire pipeline.
 */
async function seedHireableApplication(options?: {
  cpf?: string | null;
  applicationStatus?: string;
}) {
  const candidate = await candidatesRepository.create({
    tenantId,
    fullName: 'Maria Oliveira',
    email: 'maria.oliveira@example.com',
    cpf: options?.cpf === null ? undefined : (options?.cpf ?? '529.982.247-25'),
  });

  const jobPosting = await jobPostingsRepository.create({
    tenantId,
    title: 'Desenvolvedora Back-end',
    salaryMin: 5000,
  });

  const application = await applicationsRepository.create({
    tenantId,
    jobPostingId: jobPosting.id.toString(),
    candidateId: candidate.id.toString(),
    status: options?.applicationStatus ?? 'OFFER',
  });

  return { candidate, jobPosting, application };
}

describe('Hire Application Use Case', () => {
  beforeEach(() => {
    applicationsRepository = new InMemoryApplicationsRepository();
    candidatesRepository = new InMemoryCandidatesRepository();
    employeesRepository = new InMemoryEmployeesRepository();
    jobPostingsRepository = new InMemoryJobPostingsRepository();
    sut = new HireApplicationUseCase(
      applicationsRepository,
      candidatesRepository,
      employeesRepository,
      jobPostingsRepository,
    );
  });

  it('should hire a candidate creating the Employee record', async () => {
    const { application, candidate } = await seedHireableApplication();

    const result = await sut.execute({
      tenantId,
      applicationId: application.id.toString(),
    });

    expect(result.application.status).toBe('HIRED');
    expect(result.application.hiredAt).toBeDefined();
    expect(result.employee).toBeDefined();
    expect(result.employee.fullName).toBe(candidate.fullName);
    expect(result.employee.cpf.value).toBe('52998224725');
    expect(result.employee.registrationNumber).toMatch(/^EMP-[A-Z0-9]+-\d{3}$/);
    expect(result.employee.status.value).toBe('ACTIVE');
    expect(result.admissionId).toBeNull();
  });

  it('should throw 404 when application does not exist', async () => {
    await expect(
      sut.execute({
        tenantId,
        applicationId: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow('Candidatura não encontrada');
  });

  it('should throw error when hiring rejected candidate', async () => {
    const { application } = await seedHireableApplication({
      applicationStatus: 'REJECTED',
    });

    await expect(
      sut.execute({
        tenantId,
        applicationId: application.id.toString(),
      }),
    ).rejects.toThrow(
      'Não é possível contratar um candidato com candidatura rejeitada ou desistente',
    );
  });

  it('should throw error when hiring withdrawn candidate', async () => {
    const { application } = await seedHireableApplication({
      applicationStatus: 'WITHDRAWN',
    });

    await expect(
      sut.execute({
        tenantId,
        applicationId: application.id.toString(),
      }),
    ).rejects.toThrow(
      'Não é possível contratar um candidato com candidatura rejeitada ou desistente',
    );
  });

  it('should throw error when candidate already hired', async () => {
    const { application } = await seedHireableApplication({
      applicationStatus: 'HIRED',
    });

    await expect(
      sut.execute({
        tenantId,
        applicationId: application.id.toString(),
      }),
    ).rejects.toThrow('Este candidato já foi contratado');
  });

  it('should throw 400 when application is still in an early stage', async () => {
    const { application } = await seedHireableApplication({
      applicationStatus: 'APPLIED',
    });

    await expect(
      sut.execute({
        tenantId,
        applicationId: application.id.toString(),
      }),
    ).rejects.toThrow(
      'A candidatura precisa estar em uma etapa avançada do processo antes da contratação',
    );
  });

  it('should throw 422 when candidate has no CPF', async () => {
    const { application } = await seedHireableApplication({ cpf: null });

    await expect(
      sut.execute({
        tenantId,
        applicationId: application.id.toString(),
      }),
    ).rejects.toThrow(
      'Candidato não possui CPF cadastrado; não é possível realizar admissão.',
    );
  });

  it('should throw 409 when an employee with the same CPF already exists', async () => {
    const { application } = await seedHireableApplication();

    await employeesRepository.create({
      tenantId,
      registrationNumber: 'EMP-EXISTING-001',
      fullName: 'João Silva',
      cpf: CPF.create('529.982.247-25'),
      hireDate: new Date('2024-01-01'),
      status: EmployeeStatus.ACTIVE(),
      contractType: ContractType.create('CLT'),
      workRegime: WorkRegime.create('FULL_TIME'),
      weeklyHours: 44,
      country: 'Brasil',
    });

    await expect(
      sut.execute({
        tenantId,
        applicationId: application.id.toString(),
      }),
    ).rejects.toThrow('Funcionário com este CPF já existe');
  });

  it('should copy department/position from the job posting when present', async () => {
    const departmentId = new UniqueEntityID().toString();
    const positionId = new UniqueEntityID().toString();

    const candidate = await candidatesRepository.create({
      tenantId,
      fullName: 'Carlos Souza',
      email: 'carlos.souza@example.com',
      cpf: '529.982.247-25',
    });

    const jobPosting = await jobPostingsRepository.create({
      tenantId,
      title: 'Gerente Comercial',
      departmentId,
      positionId,
      salaryMin: 10000,
    });

    const application = await applicationsRepository.create({
      tenantId,
      jobPostingId: jobPosting.id.toString(),
      candidateId: candidate.id.toString(),
      status: 'OFFER',
    });

    const result = await sut.execute({
      tenantId,
      applicationId: application.id.toString(),
    });

    expect(result.employee.departmentId?.toString()).toBe(departmentId);
    expect(result.employee.positionId?.toString()).toBe(positionId);
    expect(result.employee.baseSalary).toBe(10000);
  });

  it('should keep the application status unchanged if the Employee cannot be created', async () => {
    const { application } = await seedHireableApplication();

    const originalCreate = employeesRepository.create.bind(employeesRepository);
    employeesRepository.create = async () => {
      throw new Error('Simulated DB failure');
    };

    await expect(
      sut.execute({
        tenantId,
        applicationId: application.id.toString(),
      }),
    ).rejects.toThrow('Simulated DB failure');

    const reloaded = await applicationsRepository.findById(
      application.id,
      tenantId,
    );
    expect(reloaded?.status).toBe('OFFER');

    employeesRepository.create = originalCreate;
  });
});
