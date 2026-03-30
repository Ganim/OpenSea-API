import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemorySurveysRepository } from '@/repositories/hr/in-memory/in-memory-surveys-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateSurveyUseCase } from './create-survey';

let surveysRepository: InMemorySurveysRepository;
let sut: CreateSurveyUseCase;

const tenantId = new UniqueEntityID().toString();
const createdBy = new UniqueEntityID().toString();

describe('Create Survey Use Case', () => {
  beforeEach(() => {
    surveysRepository = new InMemorySurveysRepository();
    sut = new CreateSurveyUseCase(surveysRepository);
  });

  it('should create a survey', async () => {
    const { survey } = await sut.execute({
      tenantId,
      title: 'Employee Engagement Survey Q1',
      description: 'Quarterly engagement survey',
      type: 'ENGAGEMENT',
      isAnonymous: true,
      startDate: new Date('2026-04-01'),
      endDate: new Date('2026-04-15'),
      createdBy,
    });

    expect(survey.title).toBe('Employee Engagement Survey Q1');
    expect(survey.type).toBe('ENGAGEMENT');
    expect(survey.status).toBe('DRAFT');
    expect(survey.isAnonymous).toBe(true);
    expect(surveysRepository.items).toHaveLength(1);
  });

  it('should create a non-anonymous survey by default', async () => {
    const { survey } = await sut.execute({
      tenantId,
      title: 'Exit Interview',
      type: 'EXIT',
      startDate: new Date('2026-04-01'),
      endDate: new Date('2026-04-15'),
      createdBy,
    });

    expect(survey.isAnonymous).toBe(false);
  });

  it('should reject if end date is before start date', async () => {
    await expect(
      sut.execute({
        tenantId,
        title: 'Invalid Survey',
        type: 'PULSE',
        startDate: new Date('2026-04-15'),
        endDate: new Date('2026-04-01'),
        createdBy,
      }),
    ).rejects.toThrow('End date must be after start date');
  });

  it('should reject if end date equals start date', async () => {
    const sameDate = new Date('2026-04-01');
    await expect(
      sut.execute({
        tenantId,
        title: 'Same Date Survey',
        type: 'PULSE',
        startDate: sameDate,
        endDate: sameDate,
        createdBy,
      }),
    ).rejects.toThrow('End date must be after start date');
  });
});
