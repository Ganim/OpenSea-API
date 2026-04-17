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
import { SubmitSelfAssessmentUseCase } from './submit-self-assessment';

let performanceReviewsRepository: InMemoryPerformanceReviewsRepository;
let employeesRepository: InMemoryEmployeesRepository;
let sut: SubmitSelfAssessmentUseCase;

const tenantId = new UniqueEntityID().toString();

async function makeEmployee(options: {
  userId?: UniqueEntityID;
}): Promise<Employee> {
  return await employeesRepository.create({
    tenantId,
    registrationNumber: `REG-${new UniqueEntityID().toString().slice(0, 6)}`,
    userId: options.userId,
    fullName: 'Avaliado Teste',
    cpf: CPF.create('52998224725'),
    country: 'BR',
    hireDate: new Date('2020-01-10'),
    status: EmployeeStatus.ACTIVE(),
    contractType: ContractType.CLT(),
    workRegime: WorkRegime.FULL_TIME(),
    weeklyHours: 44,
  });
}

describe('Submit Self Assessment Use Case', () => {
  beforeEach(() => {
    performanceReviewsRepository = new InMemoryPerformanceReviewsRepository();
    employeesRepository = new InMemoryEmployeesRepository();
    sut = new SubmitSelfAssessmentUseCase(
      performanceReviewsRepository,
      employeesRepository,
    );
  });

  it('should submit a self assessment when caller is the reviewee', async () => {
    const callerUserId = new UniqueEntityID();
    const reviewee = await makeEmployee({ userId: callerUserId });

    const review = await performanceReviewsRepository.create({
      tenantId,
      reviewCycleId: new UniqueEntityID(),
      employeeId: reviewee.id,
      reviewerId: new UniqueEntityID(),
      status: 'PENDING',
    });

    const result = await sut.execute({
      tenantId,
      performanceReviewId: review.id.toString(),
      callerUserId: callerUserId.toString(),
      selfScore: 4,
      selfComments: 'Bom desempenho no período',
      strengths: 'Proatividade e trabalho em equipe',
      improvements: 'Gestão de tempo',
      goals: 'Certificação PMP',
    });

    expect(result.review.status).toBe('MANAGER_REVIEW');
    expect(result.review.selfScore).toBe(4);
    expect(result.review.selfComments).toBe('Bom desempenho no período');
  });

  it('should throw ForbiddenError when caller is not the reviewee', async () => {
    const ownerUserId = new UniqueEntityID();
    const reviewee = await makeEmployee({ userId: ownerUserId });

    const review = await performanceReviewsRepository.create({
      tenantId,
      reviewCycleId: new UniqueEntityID(),
      employeeId: reviewee.id,
      reviewerId: new UniqueEntityID(),
      status: 'PENDING',
    });

    await expect(
      sut.execute({
        tenantId,
        performanceReviewId: review.id.toString(),
        callerUserId: new UniqueEntityID().toString(),
        selfScore: 4,
      }),
    ).rejects.toThrow(
      'Apenas o próprio avaliado pode submeter a autoavaliação',
    );
  });

  it('should throw error for invalid score', async () => {
    const callerUserId = new UniqueEntityID();
    const reviewee = await makeEmployee({ userId: callerUserId });

    const review = await performanceReviewsRepository.create({
      tenantId,
      reviewCycleId: new UniqueEntityID(),
      employeeId: reviewee.id,
      reviewerId: new UniqueEntityID(),
      status: 'PENDING',
    });

    await expect(
      sut.execute({
        tenantId,
        performanceReviewId: review.id.toString(),
        callerUserId: callerUserId.toString(),
        selfScore: 6,
      }),
    ).rejects.toThrow('A nota deve ser entre 1 e 5');
  });

  it('should throw error when status is not PENDING or SELF_ASSESSMENT', async () => {
    const callerUserId = new UniqueEntityID();
    const reviewee = await makeEmployee({ userId: callerUserId });

    const review = await performanceReviewsRepository.create({
      tenantId,
      reviewCycleId: new UniqueEntityID(),
      employeeId: reviewee.id,
      reviewerId: new UniqueEntityID(),
      status: 'COMPLETED',
    });

    await expect(
      sut.execute({
        tenantId,
        performanceReviewId: review.id.toString(),
        callerUserId: callerUserId.toString(),
        selfScore: 4,
      }),
    ).rejects.toThrow(
      'A autoavaliação só pode ser submetida quando o status for PENDING ou SELF_ASSESSMENT',
    );
  });

  it('should throw error for non-existent review', async () => {
    await expect(
      sut.execute({
        tenantId,
        performanceReviewId: new UniqueEntityID().toString(),
        callerUserId: new UniqueEntityID().toString(),
        selfScore: 4,
      }),
    ).rejects.toThrow('Avaliação de desempenho não encontrada');
  });
});
