import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryInterviewStagesRepository } from '@/repositories/hr/in-memory/in-memory-interview-stages-repository';
import { InMemoryJobPostingsRepository } from '@/repositories/hr/in-memory/in-memory-job-postings-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateInterviewStageUseCase } from './create-interview-stage';

let interviewStagesRepository: InMemoryInterviewStagesRepository;
let jobPostingsRepository: InMemoryJobPostingsRepository;
let sut: CreateInterviewStageUseCase;

const tenantId = new UniqueEntityID().toString();

describe('Create Interview Stage Use Case', () => {
  beforeEach(() => {
    interviewStagesRepository = new InMemoryInterviewStagesRepository();
    jobPostingsRepository = new InMemoryJobPostingsRepository();
    sut = new CreateInterviewStageUseCase(
      interviewStagesRepository,
      jobPostingsRepository,
    );
  });

  it('should create an interview stage', async () => {
    const jobPosting = await jobPostingsRepository.create({
      tenantId,
      title: 'Dev Job',
      status: 'OPEN',
    });

    const result = await sut.execute({
      tenantId,
      jobPostingId: jobPosting.id.toString(),
      name: 'Triagem Inicial',
      type: 'SCREENING',
    });

    expect(result.interviewStage).toBeDefined();
    expect(result.interviewStage.name).toBe('Triagem Inicial');
    expect(result.interviewStage.order).toBe(1);
  });

  it('should auto-increment order', async () => {
    const jobPosting = await jobPostingsRepository.create({
      tenantId,
      title: 'Dev Job',
    });

    await sut.execute({
      tenantId,
      jobPostingId: jobPosting.id.toString(),
      name: 'Stage 1',
    });

    const result = await sut.execute({
      tenantId,
      jobPostingId: jobPosting.id.toString(),
      name: 'Stage 2',
    });

    expect(result.interviewStage.order).toBe(2);
  });

  it('should throw error for empty name', async () => {
    const jobPosting = await jobPostingsRepository.create({
      tenantId,
      title: 'Dev Job',
    });

    await expect(
      sut.execute({
        tenantId,
        jobPostingId: jobPosting.id.toString(),
        name: '',
      }),
    ).rejects.toThrow('O nome da etapa é obrigatório');
  });

  it('should throw error for invalid type', async () => {
    const jobPosting = await jobPostingsRepository.create({
      tenantId,
      title: 'Dev Job',
    });

    await expect(
      sut.execute({
        tenantId,
        jobPostingId: jobPosting.id.toString(),
        name: 'Stage',
        type: 'INVALID',
      }),
    ).rejects.toThrow('Tipo de etapa inválido');
  });
});
