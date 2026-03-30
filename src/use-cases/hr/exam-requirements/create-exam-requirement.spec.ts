import { InMemoryOccupationalExamRequirementsRepository } from '@/repositories/hr/in-memory/in-memory-occupational-exam-requirements-repository';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateExamRequirementUseCase } from './create-exam-requirement';

let examRequirementsRepository: InMemoryOccupationalExamRequirementsRepository;
let sut: CreateExamRequirementUseCase;
const tenantId = new UniqueEntityID().toString();

describe('Create Exam Requirement Use Case', () => {
  beforeEach(() => {
    examRequirementsRepository =
      new InMemoryOccupationalExamRequirementsRepository();
    sut = new CreateExamRequirementUseCase(examRequirementsRepository);
  });

  it('should create an exam requirement successfully', async () => {
    const { examRequirement } = await sut.execute({
      tenantId,
      examType: 'AUDIOMETRIA',
      examCategory: 'PERIODICO',
      frequencyMonths: 12,
      isMandatory: true,
      description: 'Avaliação auditiva ocupacional',
    });

    expect(examRequirement).toBeDefined();
    expect(examRequirement.examType).toBe('AUDIOMETRIA');
    expect(examRequirement.examCategory).toBe('PERIODICO');
    expect(examRequirement.frequencyMonths).toBe(12);
    expect(examRequirement.isMandatory).toBe(true);
    expect(examRequirement.description).toBe('Avaliação auditiva ocupacional');
  });

  it('should create an exam requirement for a specific position', async () => {
    const positionId = new UniqueEntityID().toString();

    const { examRequirement } = await sut.execute({
      tenantId,
      positionId,
      examType: 'ESPIROMETRIA',
      examCategory: 'ADMISSIONAL',
      frequencyMonths: 6,
    });

    expect(examRequirement.positionId?.toString()).toBe(positionId);
    expect(examRequirement.examType).toBe('ESPIROMETRIA');
  });

  it('should throw error when exam type is empty', async () => {
    await expect(
      sut.execute({
        tenantId,
        examType: '',
        examCategory: 'PERIODICO',
        frequencyMonths: 12,
      }),
    ).rejects.toThrow('O tipo de exame é obrigatório');
  });

  it('should throw error when frequency is less than 1', async () => {
    await expect(
      sut.execute({
        tenantId,
        examType: 'AUDIOMETRIA',
        examCategory: 'PERIODICO',
        frequencyMonths: 0,
      }),
    ).rejects.toThrow('A frequência deve ser de pelo menos 1 mês');
  });

  it('should default isMandatory to true', async () => {
    const { examRequirement } = await sut.execute({
      tenantId,
      examType: 'HEMOGRAMA',
      examCategory: 'PERIODICO',
      frequencyMonths: 12,
    });

    expect(examRequirement.isMandatory).toBe(true);
  });

  it('should trim exam type and description', async () => {
    const { examRequirement } = await sut.execute({
      tenantId,
      examType: '  AUDIOMETRIA  ',
      examCategory: 'PERIODICO',
      frequencyMonths: 12,
      description: '  Descrição do exame  ',
    });

    expect(examRequirement.examType).toBe('AUDIOMETRIA');
    expect(examRequirement.description).toBe('Descrição do exame');
  });
});
