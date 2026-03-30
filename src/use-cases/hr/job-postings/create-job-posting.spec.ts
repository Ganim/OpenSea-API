import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryJobPostingsRepository } from '@/repositories/hr/in-memory/in-memory-job-postings-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateJobPostingUseCase } from './create-job-posting';

let jobPostingsRepository: InMemoryJobPostingsRepository;
let sut: CreateJobPostingUseCase;

const tenantId = new UniqueEntityID().toString();

describe('Create Job Posting Use Case', () => {
  beforeEach(() => {
    jobPostingsRepository = new InMemoryJobPostingsRepository();
    sut = new CreateJobPostingUseCase(jobPostingsRepository);
  });

  it('should create a job posting successfully', async () => {
    const result = await sut.execute({
      tenantId,
      title: 'Desenvolvedor Full Stack Senior',
      description: 'Vaga para desenvolvedor full stack',
      type: 'FULL_TIME',
      location: 'São Paulo, SP',
      salaryMin: 8000,
      salaryMax: 15000,
    });

    expect(result.jobPosting).toBeDefined();
    expect(result.jobPosting.title).toBe('Desenvolvedor Full Stack Senior');
    expect(result.jobPosting.status).toBe('DRAFT');
    expect(result.jobPosting.type).toBe('FULL_TIME');
    expect(jobPostingsRepository.items).toHaveLength(1);
  });

  it('should create a job posting with default type', async () => {
    const result = await sut.execute({
      tenantId,
      title: 'Analista de Dados',
    });

    expect(result.jobPosting.type).toBe('FULL_TIME');
    expect(result.jobPosting.status).toBe('DRAFT');
  });

  it('should throw error for empty title', async () => {
    await expect(
      sut.execute({
        tenantId,
        title: '',
      }),
    ).rejects.toThrow('O título da vaga é obrigatório');
  });

  it('should throw error for invalid type', async () => {
    await expect(
      sut.execute({
        tenantId,
        title: 'Vaga Teste',
        type: 'INVALID_TYPE',
      }),
    ).rejects.toThrow('Tipo de vaga inválido');
  });

  it('should throw error when salaryMin exceeds salaryMax', async () => {
    await expect(
      sut.execute({
        tenantId,
        title: 'Vaga Teste',
        salaryMin: 20000,
        salaryMax: 10000,
      }),
    ).rejects.toThrow(
      'O salário mínimo não pode ser maior que o salário máximo',
    );
  });

  it('should trim whitespace from title', async () => {
    const result = await sut.execute({
      tenantId,
      title: '  Desenvolvedor Backend  ',
    });

    expect(result.jobPosting.title).toBe('Desenvolvedor Backend');
  });
});
