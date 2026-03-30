import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryInterviewStagesRepository } from '@/repositories/hr/in-memory/in-memory-interview-stages-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { DeleteInterviewStageUseCase } from './delete-interview-stage';

let interviewStagesRepository: InMemoryInterviewStagesRepository;
let sut: DeleteInterviewStageUseCase;

const tenantId = new UniqueEntityID().toString();

describe('Delete Interview Stage Use Case', () => {
  beforeEach(() => {
    interviewStagesRepository = new InMemoryInterviewStagesRepository();
    sut = new DeleteInterviewStageUseCase(interviewStagesRepository);
  });

  it('should delete an interview stage', async () => {
    const stage = await interviewStagesRepository.create({
      tenantId,
      jobPostingId: new UniqueEntityID().toString(),
      name: 'To Delete',
      order: 1,
    });

    const result = await sut.execute({
      tenantId,
      interviewStageId: stage.id.toString(),
    });

    expect(result.success).toBe(true);
    expect(interviewStagesRepository.items).toHaveLength(0);
  });

  it('should throw error for non-existing stage', async () => {
    await expect(
      sut.execute({
        tenantId,
        interviewStageId: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow('Etapa não encontrada');
  });
});
