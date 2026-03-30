import { InMemoryOccupationalExamRequirementsRepository } from '@/repositories/hr/in-memory/in-memory-occupational-exam-requirements-repository';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { beforeEach, describe, expect, it } from 'vitest';
import { DeleteExamRequirementUseCase } from './delete-exam-requirement';

let examRequirementsRepository: InMemoryOccupationalExamRequirementsRepository;
let sut: DeleteExamRequirementUseCase;
const tenantId = new UniqueEntityID().toString();

describe('Delete Exam Requirement Use Case', () => {
  beforeEach(() => {
    examRequirementsRepository =
      new InMemoryOccupationalExamRequirementsRepository();
    sut = new DeleteExamRequirementUseCase(examRequirementsRepository);
  });

  it('should delete an exam requirement successfully', async () => {
    const requirement = await examRequirementsRepository.create({
      tenantId,
      examType: 'AUDIOMETRIA',
      examCategory: 'PERIODICO',
      frequencyMonths: 12,
    });

    await sut.execute({
      tenantId,
      requirementId: requirement.id.toString(),
    });

    const found = await examRequirementsRepository.findById(
      requirement.id,
      tenantId,
    );
    expect(found).toBeNull();
  });

  it('should throw error when requirement does not exist', async () => {
    const nonExistentId = new UniqueEntityID().toString();

    await expect(
      sut.execute({
        tenantId,
        requirementId: nonExistentId,
      }),
    ).rejects.toThrow('Requisito de exame ocupacional não encontrado');
  });
});
