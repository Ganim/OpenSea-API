import { InMemoryOccupationalExamRequirementsRepository } from '@/repositories/hr/in-memory/in-memory-occupational-exam-requirements-repository';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListExamRequirementsUseCase } from './list-exam-requirements';

let examRequirementsRepository: InMemoryOccupationalExamRequirementsRepository;
let sut: ListExamRequirementsUseCase;
const tenantId = new UniqueEntityID().toString();

describe('List Exam Requirements Use Case', () => {
  beforeEach(() => {
    examRequirementsRepository =
      new InMemoryOccupationalExamRequirementsRepository();
    sut = new ListExamRequirementsUseCase(examRequirementsRepository);
  });

  it('should list all exam requirements for a tenant', async () => {
    await examRequirementsRepository.create({
      tenantId,
      examType: 'AUDIOMETRIA',
      examCategory: 'PERIODICO',
      frequencyMonths: 12,
    });

    await examRequirementsRepository.create({
      tenantId,
      examType: 'HEMOGRAMA',
      examCategory: 'ADMISSIONAL',
      frequencyMonths: 6,
    });

    const { examRequirements } = await sut.execute({ tenantId });

    expect(examRequirements).toHaveLength(2);
  });

  it('should filter by position', async () => {
    const positionId = new UniqueEntityID().toString();

    await examRequirementsRepository.create({
      tenantId,
      positionId,
      examType: 'ESPIROMETRIA',
      examCategory: 'ADMISSIONAL',
      frequencyMonths: 12,
    });

    await examRequirementsRepository.create({
      tenantId,
      examType: 'HEMOGRAMA',
      examCategory: 'PERIODICO',
      frequencyMonths: 6,
    });

    const { examRequirements } = await sut.execute({
      tenantId,
      positionId,
    });

    expect(examRequirements).toHaveLength(1);
    expect(examRequirements[0].examType).toBe('ESPIROMETRIA');
  });

  it('should filter by exam category', async () => {
    await examRequirementsRepository.create({
      tenantId,
      examType: 'AUDIOMETRIA',
      examCategory: 'PERIODICO',
      frequencyMonths: 12,
    });

    await examRequirementsRepository.create({
      tenantId,
      examType: 'HEMOGRAMA',
      examCategory: 'ADMISSIONAL',
      frequencyMonths: 6,
    });

    const { examRequirements } = await sut.execute({
      tenantId,
      examCategory: 'PERIODICO',
    });

    expect(examRequirements).toHaveLength(1);
    expect(examRequirements[0].examType).toBe('AUDIOMETRIA');
  });

  it('should return empty array when no requirements exist', async () => {
    const { examRequirements } = await sut.execute({ tenantId });
    expect(examRequirements).toHaveLength(0);
  });
});
