import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Employee } from '@/entities/hr/employee';
import {
  ContractType,
  CPF,
  EmployeeStatus,
  WorkRegime,
} from '@/entities/hr/value-objects';
import { InMemoryEmployeesRepository } from '@/repositories/hr/in-memory/in-memory-employees-repository';
import { InMemoryPerformanceReviewsRepository } from '@/repositories/hr/in-memory/in-memory-performance-reviews-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { SubmitManagerReviewUseCase } from './submit-manager-review';

let performanceReviewsRepository: InMemoryPerformanceReviewsRepository;
let employeesRepository: InMemoryEmployeesRepository;
let sut: SubmitManagerReviewUseCase;

const tenantId = new UniqueEntityID().toString();

async function makeEmployee(options: {
  userId?: UniqueEntityID;
  supervisorId?: UniqueEntityID;
}): Promise<Employee> {
  return await employeesRepository.create({
    tenantId,
    registrationNumber: `REG-${new UniqueEntityID().toString().slice(0, 6)}`,
    userId: options.userId,
    supervisorId: options.supervisorId,
    fullName: 'Funcionário Teste',
    cpf: CPF.create('52998224725'),
    country: 'BR',
    hireDate: new Date('2020-01-10'),
    status: EmployeeStatus.ACTIVE(),
    contractType: ContractType.CLT(),
    workRegime: WorkRegime.FULL_TIME(),
    weeklyHours: 44,
  });
}

describe('Submit Manager Review Use Case', () => {
  beforeEach(() => {
    performanceReviewsRepository = new InMemoryPerformanceReviewsRepository();
    employeesRepository = new InMemoryEmployeesRepository();
    sut = new SubmitManagerReviewUseCase(
      performanceReviewsRepository,
      employeesRepository,
    );
  });

  it('should submit a manager review when caller is the designated reviewer', async () => {
    const reviewerUserId = new UniqueEntityID();
    const reviewer = await makeEmployee({ userId: reviewerUserId });
    const reviewee = await makeEmployee({
      userId: new UniqueEntityID(),
      supervisorId: reviewer.id,
    });

    const review = await performanceReviewsRepository.create({
      tenantId,
      reviewCycleId: new UniqueEntityID(),
      employeeId: reviewee.id,
      reviewerId: reviewer.id,
      status: 'MANAGER_REVIEW',
    });

    const result = await sut.execute({
      tenantId,
      performanceReviewId: review.id.toString(),
      callerUserId: reviewerUserId.toString(),
      managerScore: 4,
      managerComments: 'Excelente colaborador',
      strengths: 'Liderança e comunicação',
      improvements: 'Pontualidade',
      goals: 'Assumir gestão de projeto',
    });

    expect(result.review.status).toBe('COMPLETED');
    expect(result.review.managerScore).toBe(4);
    expect(result.review.completedAt).toBeDefined();
  });

  it('should submit a manager review when caller is the direct supervisor', async () => {
    const supervisorUserId = new UniqueEntityID();
    const supervisor = await makeEmployee({ userId: supervisorUserId });
    const reviewee = await makeEmployee({
      userId: new UniqueEntityID(),
      supervisorId: supervisor.id,
    });

    // Reviewer assigned is a different employee (e.g. HR)
    const reviewer = await makeEmployee({ userId: new UniqueEntityID() });

    const review = await performanceReviewsRepository.create({
      tenantId,
      reviewCycleId: new UniqueEntityID(),
      employeeId: reviewee.id,
      reviewerId: reviewer.id,
      status: 'MANAGER_REVIEW',
    });

    const result = await sut.execute({
      tenantId,
      performanceReviewId: review.id.toString(),
      callerUserId: supervisorUserId.toString(),
      managerScore: 3,
    });

    expect(result.review.status).toBe('COMPLETED');
    expect(result.review.managerScore).toBe(3);
  });

  it('should throw ForbiddenError when caller is neither reviewer nor supervisor', async () => {
    const reviewer = await makeEmployee({ userId: new UniqueEntityID() });
    const reviewee = await makeEmployee({
      userId: new UniqueEntityID(),
      supervisorId: new UniqueEntityID(),
    });

    const review = await performanceReviewsRepository.create({
      tenantId,
      reviewCycleId: new UniqueEntityID(),
      employeeId: reviewee.id,
      reviewerId: reviewer.id,
      status: 'MANAGER_REVIEW',
    });

    await expect(
      sut.execute({
        tenantId,
        performanceReviewId: review.id.toString(),
        callerUserId: new UniqueEntityID().toString(),
        managerScore: 4,
      }),
    ).rejects.toThrow(
      'Apenas o avaliador designado ou o supervisor direto pode submeter a avaliação do gestor',
    );
  });

  it('should allow submission when bypassOwnership is true (admin)', async () => {
    const reviewer = await makeEmployee({ userId: new UniqueEntityID() });
    const reviewee = await makeEmployee({
      userId: new UniqueEntityID(),
      supervisorId: new UniqueEntityID(),
    });

    const review = await performanceReviewsRepository.create({
      tenantId,
      reviewCycleId: new UniqueEntityID(),
      employeeId: reviewee.id,
      reviewerId: reviewer.id,
      status: 'MANAGER_REVIEW',
    });

    const result = await sut.execute({
      tenantId,
      performanceReviewId: review.id.toString(),
      callerUserId: new UniqueEntityID().toString(),
      bypassOwnership: true,
      managerScore: 5,
    });

    expect(result.review.status).toBe('COMPLETED');
    expect(result.review.managerScore).toBe(5);
  });

  it('should throw error when status is not MANAGER_REVIEW', async () => {
    const reviewerUserId = new UniqueEntityID();
    const reviewer = await makeEmployee({ userId: reviewerUserId });
    const reviewee = await makeEmployee({
      userId: new UniqueEntityID(),
      supervisorId: reviewer.id,
    });

    const review = await performanceReviewsRepository.create({
      tenantId,
      reviewCycleId: new UniqueEntityID(),
      employeeId: reviewee.id,
      reviewerId: reviewer.id,
      status: 'PENDING',
    });

    await expect(
      sut.execute({
        tenantId,
        performanceReviewId: review.id.toString(),
        callerUserId: reviewerUserId.toString(),
        managerScore: 4,
      }),
    ).rejects.toThrow(
      'A avaliação do gestor só pode ser submetida quando o status for MANAGER_REVIEW',
    );
  });

  it('should throw error for invalid score', async () => {
    const reviewerUserId = new UniqueEntityID();
    const reviewer = await makeEmployee({ userId: reviewerUserId });
    const reviewee = await makeEmployee({
      userId: new UniqueEntityID(),
      supervisorId: reviewer.id,
    });

    const review = await performanceReviewsRepository.create({
      tenantId,
      reviewCycleId: new UniqueEntityID(),
      employeeId: reviewee.id,
      reviewerId: reviewer.id,
      status: 'MANAGER_REVIEW',
    });

    await expect(
      sut.execute({
        tenantId,
        performanceReviewId: review.id.toString(),
        callerUserId: reviewerUserId.toString(),
        managerScore: 0,
      }),
    ).rejects.toThrow('A nota deve ser entre 1 e 5');
  });

  it('should throw error for non-existent review', async () => {
    await expect(
      sut.execute({
        tenantId,
        performanceReviewId: new UniqueEntityID().toString(),
        callerUserId: new UniqueEntityID().toString(),
        managerScore: 4,
      }),
    ).rejects.toThrow('Avaliação de desempenho não encontrada');
  });
});
