import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemorySurveysRepository } from '@/repositories/hr/in-memory/in-memory-surveys-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { DeleteSurveyUseCase } from './delete-survey';

let surveysRepository: InMemorySurveysRepository;
let sut: DeleteSurveyUseCase;

const tenantId = new UniqueEntityID().toString();

describe('Delete Survey Use Case', () => {
  beforeEach(() => {
    surveysRepository = new InMemorySurveysRepository();
    sut = new DeleteSurveyUseCase(surveysRepository);
  });

  it('should delete a draft survey', async () => {
    const created = await surveysRepository.create({
      tenantId,
      title: 'To Delete',
      type: 'PULSE',
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400000),
      createdBy: new UniqueEntityID(),
    });

    await sut.execute({ tenantId, surveyId: created.id.toString() });

    expect(surveysRepository.items).toHaveLength(0);
  });

  it('should throw if survey not found', async () => {
    await expect(
      sut.execute({
        tenantId,
        surveyId: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow('Survey not found');
  });

  it('should throw if survey is active', async () => {
    const created = await surveysRepository.create({
      tenantId,
      title: 'Active Survey',
      type: 'ENGAGEMENT',
      status: 'ACTIVE',
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400000),
      createdBy: new UniqueEntityID(),
    });

    await expect(
      sut.execute({ tenantId, surveyId: created.id.toString() }),
    ).rejects.toThrow('Cannot delete an active survey');
  });
});
