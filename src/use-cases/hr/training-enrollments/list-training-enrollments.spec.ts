import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryTrainingEnrollmentsRepository } from '@/repositories/hr/in-memory/in-memory-training-enrollments-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListTrainingEnrollmentsUseCase } from './list-training-enrollments';

let trainingEnrollmentsRepository: InMemoryTrainingEnrollmentsRepository;
let sut: ListTrainingEnrollmentsUseCase;

const tenantId = new UniqueEntityID().toString();
const programId = new UniqueEntityID();
const employeeId1 = new UniqueEntityID();
const employeeId2 = new UniqueEntityID();

describe('List Training Enrollments Use Case', () => {
  beforeEach(async () => {
    trainingEnrollmentsRepository = new InMemoryTrainingEnrollmentsRepository();
    sut = new ListTrainingEnrollmentsUseCase(trainingEnrollmentsRepository);

    await trainingEnrollmentsRepository.create({
      tenantId,
      trainingProgramId: programId,
      employeeId: employeeId1,
    });

    await trainingEnrollmentsRepository.create({
      tenantId,
      trainingProgramId: programId,
      employeeId: employeeId2,
      status: 'COMPLETED',
    });
  });

  it('should list all enrollments for the tenant', async () => {
    const result = await sut.execute({ tenantId });

    expect(result.enrollments).toHaveLength(2);
    expect(result.total).toBe(2);
  });

  it('should filter by training program', async () => {
    const result = await sut.execute({
      tenantId,
      trainingProgramId: programId.toString(),
    });

    expect(result.enrollments).toHaveLength(2);
  });

  it('should filter by employee', async () => {
    const result = await sut.execute({
      tenantId,
      employeeId: employeeId1.toString(),
    });

    expect(result.enrollments).toHaveLength(1);
  });

  it('should filter by status', async () => {
    const result = await sut.execute({
      tenantId,
      status: 'COMPLETED',
    });

    expect(result.enrollments).toHaveLength(1);
    expect(result.enrollments[0].status).toBe('COMPLETED');
  });

  it('should paginate results', async () => {
    const result = await sut.execute({ tenantId, page: 1, perPage: 1 });

    expect(result.enrollments).toHaveLength(1);
    expect(result.total).toBe(2);
  });
});
