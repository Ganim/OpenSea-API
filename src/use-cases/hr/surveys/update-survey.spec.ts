import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemorySurveysRepository } from '@/repositories/hr/in-memory/in-memory-surveys-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { UpdateSurveyUseCase } from './update-survey';

let surveysRepository: InMemorySurveysRepository;
let sut: UpdateSurveyUseCase;

const tenantId = new UniqueEntityID().toString();

describe('Update Survey Use Case', () => {
  beforeEach(() => {
    surveysRepository = new InMemorySurveysRepository();
    sut = new UpdateSurveyUseCase(surveysRepository);
  });

  it('should update a draft survey', async () => {
    const created = await surveysRepository.create({
      tenantId,
      title: 'Original Title',
      type: 'ENGAGEMENT',
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400000),
      createdBy: new UniqueEntityID(),
    });

    const { survey } = await sut.execute({
      tenantId,
      surveyId: created.id.toString(),
      title: 'Updated Title',
    });

    expect(survey.title).toBe('Updated Title');
  });

  it('should throw if survey not found', async () => {
    await expect(
      sut.execute({
        tenantId,
        surveyId: new UniqueEntityID().toString(),
        title: 'Test',
      }),
    ).rejects.toThrow('Survey not found');
  });

  it('should throw if survey is not draft', async () => {
    const created = await surveysRepository.create({
      tenantId,
      title: 'Active Survey',
      type: 'PULSE',
      status: 'ACTIVE',
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400000),
      createdBy: new UniqueEntityID(),
    });

    await expect(
      sut.execute({
        tenantId,
        surveyId: created.id.toString(),
        title: 'New Title',
      }),
    ).rejects.toThrow('Only draft surveys can be updated');
  });
});
