import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryApplicationsRepository } from '@/repositories/hr/in-memory/in-memory-applications-repository';
import { InMemoryCandidatesRepository } from '@/repositories/hr/in-memory/in-memory-candidates-repository';
import { InMemoryJobPostingsRepository } from '@/repositories/hr/in-memory/in-memory-job-postings-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateApplicationUseCase } from './create-application';

let applicationsRepository: InMemoryApplicationsRepository;
let jobPostingsRepository: InMemoryJobPostingsRepository;
let candidatesRepository: InMemoryCandidatesRepository;
let sut: CreateApplicationUseCase;

const tenantId = new UniqueEntityID().toString();

describe('Create Application Use Case', () => {
  beforeEach(() => {
    applicationsRepository = new InMemoryApplicationsRepository();
    jobPostingsRepository = new InMemoryJobPostingsRepository();
    candidatesRepository = new InMemoryCandidatesRepository();
    sut = new CreateApplicationUseCase(
      applicationsRepository,
      jobPostingsRepository,
      candidatesRepository,
    );
  });

  it('should create an application successfully', async () => {
    const jobPosting = await jobPostingsRepository.create({
      tenantId,
      title: 'Dev Full Stack',
      status: 'OPEN',
    });

    const candidate = await candidatesRepository.create({
      tenantId,
      fullName: 'Maria Silva',
      email: 'maria@test.com',
    });

    const result = await sut.execute({
      tenantId,
      jobPostingId: jobPosting.id.toString(),
      candidateId: candidate.id.toString(),
    });

    expect(result.application).toBeDefined();
    expect(result.application.status).toBe('APPLIED');
    expect(applicationsRepository.items).toHaveLength(1);
  });

  it('should throw error for non-open job posting', async () => {
    const jobPosting = await jobPostingsRepository.create({
      tenantId,
      title: 'Draft Job',
      status: 'DRAFT',
    });

    const candidate = await candidatesRepository.create({
      tenantId,
      fullName: 'Maria',
      email: 'maria@test.com',
    });

    await expect(
      sut.execute({
        tenantId,
        jobPostingId: jobPosting.id.toString(),
        candidateId: candidate.id.toString(),
      }),
    ).rejects.toThrow(
      'Não é possível candidatar-se a uma vaga que não está aberta',
    );
  });

  it('should throw error for duplicate application', async () => {
    const jobPosting = await jobPostingsRepository.create({
      tenantId,
      title: 'Dev Job',
      status: 'OPEN',
    });

    const candidate = await candidatesRepository.create({
      tenantId,
      fullName: 'Maria',
      email: 'maria@test.com',
    });

    await sut.execute({
      tenantId,
      jobPostingId: jobPosting.id.toString(),
      candidateId: candidate.id.toString(),
    });

    await expect(
      sut.execute({
        tenantId,
        jobPostingId: jobPosting.id.toString(),
        candidateId: candidate.id.toString(),
      }),
    ).rejects.toThrow(
      'Este candidato já possui uma candidatura para esta vaga',
    );
  });

  it('should throw error when max applicants reached', async () => {
    const jobPosting = await jobPostingsRepository.create({
      tenantId,
      title: 'Limited Job',
      status: 'OPEN',
      maxApplicants: 1,
    });

    const candidate1 = await candidatesRepository.create({
      tenantId,
      fullName: 'Candidate 1',
      email: 'c1@test.com',
    });

    const candidate2 = await candidatesRepository.create({
      tenantId,
      fullName: 'Candidate 2',
      email: 'c2@test.com',
    });

    await sut.execute({
      tenantId,
      jobPostingId: jobPosting.id.toString(),
      candidateId: candidate1.id.toString(),
    });

    await expect(
      sut.execute({
        tenantId,
        jobPostingId: jobPosting.id.toString(),
        candidateId: candidate2.id.toString(),
      }),
    ).rejects.toThrow(
      'O número máximo de candidatos para esta vaga foi atingido',
    );
  });
});
