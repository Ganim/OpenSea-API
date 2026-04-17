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
import { AdvanceReviewStatusUseCase } from './advance-status';

let performanceReviewsRepository: InMemoryPerformanceReviewsRepository;
let employeesRepository: InMemoryEmployeesRepository;
let sut: AdvanceReviewStatusUseCase;

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

describe('Advance Review Status Use Case', () => {
  beforeEach(() => {
    performanceReviewsRepository = new InMemoryPerformanceReviewsRepository();
    employeesRepository = new InMemoryEmployeesRepository();
    sut = new AdvanceReviewStatusUseCase(
      performanceReviewsRepository,
      employeesRepository,
    );
  });

  it('should advance PENDING → SELF_ASSESSMENT when caller is the reviewee', async () => {
    const revieweeUserId = new UniqueEntityID();
    const reviewer = await makeEmployee({ userId: new UniqueEntityID() });
    const reviewee = await makeEmployee({
      userId: revieweeUserId,
      supervisorId: reviewer.id,
    });

    const review = await performanceReviewsRepository.create({
      tenantId,
      reviewCycleId: new UniqueEntityID(),
      employeeId: reviewee.id,
      reviewerId: reviewer.id,
      status: 'PENDING',
    });

    const result = await sut.execute({
      tenantId,
      performanceReviewId: review.id.toString(),
      callerUserId: revieweeUserId.toString(),
    });

    expect(result.review.status).toBe('SELF_ASSESSMENT');
    expect(result.review.completedAt).toBeUndefined();
  });

  it('should advance SELF_ASSESSMENT → MANAGER_REVIEW when caller is the reviewer', async () => {
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
      status: 'SELF_ASSESSMENT',
    });

    const result = await sut.execute({
      tenantId,
      performanceReviewId: review.id.toString(),
      callerUserId: reviewerUserId.toString(),
    });

    expect(result.review.status).toBe('MANAGER_REVIEW');
    expect(result.review.completedAt).toBeUndefined();
  });

  it('should advance MANAGER_REVIEW → COMPLETED when caller is the supervisor and set completedAt', async () => {
    const supervisorUserId = new UniqueEntityID();
    const supervisor = await makeEmployee({ userId: supervisorUserId });
    const reviewee = await makeEmployee({
      userId: new UniqueEntityID(),
      supervisorId: supervisor.id,
    });
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
    });

    expect(result.review.status).toBe('COMPLETED');
    expect(result.review.completedAt).toBeInstanceOf(Date);
  });

  it('REGRESSION: must NOT overwrite existing scores/comments when advancing status', async () => {
    // This is the P0 regression that triggered this fix. Before this use case
    // existed, the UI called `submitSelfAssessment` with `selfScore: 0` just to
    // push the status forward, wiping the real score. Here we assert that
    // pre-existing scores and comments remain intact after `advance-status`.
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
      status: 'SELF_ASSESSMENT',
    });

    // Seed pre-existing scores + comments directly on the in-memory record.
    await performanceReviewsRepository.update({
      id: review.id,
      tenantId,
      selfScore: 4,
      selfComments: 'Minha autoavaliação',
      strengths: 'Comunicação',
      improvements: 'Pontualidade',
      goals: 'Liderar projeto X',
    });

    const result = await sut.execute({
      tenantId,
      performanceReviewId: review.id.toString(),
      callerUserId: reviewerUserId.toString(),
    });

    expect(result.review.status).toBe('MANAGER_REVIEW');
    expect(result.review.selfScore).toBe(4);
    expect(result.review.selfComments).toBe('Minha autoavaliação');
    expect(result.review.strengths).toBe('Comunicação');
    expect(result.review.improvements).toBe('Pontualidade');
    expect(result.review.goals).toBe('Liderar projeto X');
    expect(result.review.managerScore).toBeUndefined();
  });

  it('should throw ForbiddenError when caller is unrelated to the review', async () => {
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
      status: 'PENDING',
    });

    await expect(
      sut.execute({
        tenantId,
        performanceReviewId: review.id.toString(),
        callerUserId: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow(
      'Apenas o avaliado, o avaliador designado ou o supervisor direto pode avançar o status da avaliação',
    );
  });

  it('should advance when bypassOwnership is true even if caller is unrelated (admin)', async () => {
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
    });

    expect(result.review.status).toBe('COMPLETED');
    expect(result.review.completedAt).toBeInstanceOf(Date);
  });

  it('should throw ResourceNotFoundError for a non-existent review', async () => {
    await expect(
      sut.execute({
        tenantId,
        performanceReviewId: new UniqueEntityID().toString(),
        callerUserId: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow('Avaliação de desempenho não encontrada');
  });

  it('should throw BadRequestError when current status is COMPLETED (terminal)', async () => {
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
      status: 'COMPLETED',
    });

    await expect(
      sut.execute({
        tenantId,
        performanceReviewId: review.id.toString(),
        callerUserId: reviewerUserId.toString(),
      }),
    ).rejects.toThrow(
      'O status atual da avaliação não permite avanço automático',
    );
  });
});
