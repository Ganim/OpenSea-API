import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryApplicationsRepository } from '@/repositories/hr/in-memory/in-memory-applications-repository';
import { InMemoryInterviewStagesRepository } from '@/repositories/hr/in-memory/in-memory-interview-stages-repository';
import { InMemoryInterviewsRepository } from '@/repositories/hr/in-memory/in-memory-interviews-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ScheduleInterviewUseCase } from './schedule-interview';

let interviewsRepository: InMemoryInterviewsRepository;
let applicationsRepository: InMemoryApplicationsRepository;
let interviewStagesRepository: InMemoryInterviewStagesRepository;
let sut: ScheduleInterviewUseCase;

const tenantId = new UniqueEntityID().toString();

describe('Schedule Interview Use Case', () => {
  beforeEach(() => {
    interviewsRepository = new InMemoryInterviewsRepository();
    applicationsRepository = new InMemoryApplicationsRepository();
    interviewStagesRepository = new InMemoryInterviewStagesRepository();
    sut = new ScheduleInterviewUseCase(
      interviewsRepository,
      applicationsRepository,
      interviewStagesRepository,
    );
  });

  it('should schedule an interview', async () => {
    const application = await applicationsRepository.create({
      tenantId,
      jobPostingId: new UniqueEntityID().toString(),
      candidateId: new UniqueEntityID().toString(),
      status: 'SCREENING',
    });

    const stage = await interviewStagesRepository.create({
      tenantId,
      jobPostingId: new UniqueEntityID().toString(),
      name: 'Technical',
      order: 1,
    });

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);

    const result = await sut.execute({
      tenantId,
      applicationId: application.id.toString(),
      interviewStageId: stage.id.toString(),
      interviewerId: new UniqueEntityID().toString(),
      scheduledAt: futureDate,
      duration: 90,
    });

    expect(result.interview).toBeDefined();
    expect(result.interview.status).toBe('SCHEDULED');
    expect(result.interview.duration).toBe(90);
  });

  it('should throw error for finalized application', async () => {
    const application = await applicationsRepository.create({
      tenantId,
      jobPostingId: new UniqueEntityID().toString(),
      candidateId: new UniqueEntityID().toString(),
      status: 'REJECTED',
    });

    const stage = await interviewStagesRepository.create({
      tenantId,
      jobPostingId: new UniqueEntityID().toString(),
      name: 'Technical',
      order: 1,
    });

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);

    await expect(
      sut.execute({
        tenantId,
        applicationId: application.id.toString(),
        interviewStageId: stage.id.toString(),
        interviewerId: new UniqueEntityID().toString(),
        scheduledAt: futureDate,
      }),
    ).rejects.toThrow(
      'Não é possível agendar entrevista para uma candidatura finalizada',
    );
  });

  it('should throw error for past date', async () => {
    const application = await applicationsRepository.create({
      tenantId,
      jobPostingId: new UniqueEntityID().toString(),
      candidateId: new UniqueEntityID().toString(),
    });

    const stage = await interviewStagesRepository.create({
      tenantId,
      jobPostingId: new UniqueEntityID().toString(),
      name: 'Technical',
      order: 1,
    });

    const pastDate = new Date('2020-01-01');

    await expect(
      sut.execute({
        tenantId,
        applicationId: application.id.toString(),
        interviewStageId: stage.id.toString(),
        interviewerId: new UniqueEntityID().toString(),
        scheduledAt: pastDate,
      }),
    ).rejects.toThrow('A data da entrevista não pode ser no passado');
  });
});
