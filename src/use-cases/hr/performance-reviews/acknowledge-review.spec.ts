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
import { AcknowledgeReviewUseCase } from './acknowledge-review';

let performanceReviewsRepository: InMemoryPerformanceReviewsRepository;
let employeesRepository: InMemoryEmployeesRepository;
let sut: AcknowledgeReviewUseCase;

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

describe('Acknowledge Review Use Case', () => {
  beforeEach(() => {
    performanceReviewsRepository = new InMemoryPerformanceReviewsRepository();
    employeesRepository = new InMemoryEmployeesRepository();
    sut = new AcknowledgeReviewUseCase(
      performanceReviewsRepository,
      employeesRepository,
    );
  });

  it('should acknowledge a completed review when caller is the reviewee', async () => {
    const callerUserId = new UniqueEntityID();
    const reviewee = await makeEmployee({ userId: callerUserId });

    const review = await performanceReviewsRepository.create({
      tenantId,
      reviewCycleId: new UniqueEntityID(),
      employeeId: reviewee.id,
      reviewerId: new UniqueEntityID(),
      status: 'COMPLETED',
    });

    const result = await sut.execute({
      tenantId,
      performanceReviewId: review.id.toString(),
      callerUserId: callerUserId.toString(),
    });

    expect(result.review.employeeAcknowledged).toBe(true);
    expect(result.review.acknowledgedAt).toBeDefined();
  });

  it('should throw ForbiddenError when caller is not the reviewee', async () => {
    const ownerUserId = new UniqueEntityID();
    const reviewee = await makeEmployee({ userId: ownerUserId });

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
        callerUserId: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow(
      'Apenas o próprio avaliado pode reconhecer esta avaliação',
    );
  });

  it('should throw error when review is not completed', async () => {
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
      }),
    ).rejects.toThrow(
      'Apenas avaliações concluídas podem ser reconhecidas pelo funcionário',
    );
  });

  it('should throw error when already acknowledged', async () => {
    const callerUserId = new UniqueEntityID();
    const reviewee = await makeEmployee({ userId: callerUserId });

    const review = await performanceReviewsRepository.create({
      tenantId,
      reviewCycleId: new UniqueEntityID(),
      employeeId: reviewee.id,
      reviewerId: new UniqueEntityID(),
      status: 'COMPLETED',
    });

    // First acknowledge
    await sut.execute({
      tenantId,
      performanceReviewId: review.id.toString(),
      callerUserId: callerUserId.toString(),
    });

    // Second acknowledge should fail
    await expect(
      sut.execute({
        tenantId,
        performanceReviewId: review.id.toString(),
        callerUserId: callerUserId.toString(),
      }),
    ).rejects.toThrow('Esta avaliação já foi reconhecida pelo funcionário');
  });

  it('should throw error for non-existent review', async () => {
    await expect(
      sut.execute({
        tenantId,
        performanceReviewId: new UniqueEntityID().toString(),
        callerUserId: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow('Avaliação de desempenho não encontrada');
  });
});
