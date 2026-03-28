import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryTrainingProgramsRepository } from '@/repositories/hr/in-memory/in-memory-training-programs-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListTrainingProgramsUseCase } from './list-training-programs';

let trainingProgramsRepository: InMemoryTrainingProgramsRepository;
let sut: ListTrainingProgramsUseCase;

const tenantId = new UniqueEntityID().toString();

describe('List Training Programs Use Case', () => {
  beforeEach(async () => {
    trainingProgramsRepository = new InMemoryTrainingProgramsRepository();
    sut = new ListTrainingProgramsUseCase(trainingProgramsRepository);

    await trainingProgramsRepository.create({
      tenantId,
      name: 'NR-35 Trabalho em Altura',
      category: 'SAFETY',
      format: 'PRESENCIAL',
      durationHours: 8,
      isMandatory: true,
    });

    await trainingProgramsRepository.create({
      tenantId,
      name: 'Liderança Situacional',
      category: 'LEADERSHIP',
      format: 'ONLINE',
      durationHours: 16,
    });

    await trainingProgramsRepository.create({
      tenantId,
      name: 'Python Avançado',
      category: 'TECHNICAL',
      format: 'ONLINE',
      durationHours: 40,
    });
  });

  it('should list all programs for the tenant', async () => {
    const result = await sut.execute({ tenantId });

    expect(result.trainingPrograms).toHaveLength(3);
    expect(result.total).toBe(3);
  });

  it('should filter by category', async () => {
    const result = await sut.execute({ tenantId, category: 'SAFETY' });

    expect(result.trainingPrograms).toHaveLength(1);
    expect(result.trainingPrograms[0].category).toBe('SAFETY');
  });

  it('should filter by format', async () => {
    const result = await sut.execute({ tenantId, format: 'ONLINE' });

    expect(result.trainingPrograms).toHaveLength(2);
  });

  it('should filter by mandatory', async () => {
    const result = await sut.execute({ tenantId, isMandatory: true });

    expect(result.trainingPrograms).toHaveLength(1);
    expect(result.trainingPrograms[0].isMandatory).toBe(true);
  });

  it('should search by name', async () => {
    const result = await sut.execute({ tenantId, search: 'python' });

    expect(result.trainingPrograms).toHaveLength(1);
    expect(result.trainingPrograms[0].name).toBe('Python Avançado');
  });

  it('should paginate results', async () => {
    const result = await sut.execute({ tenantId, page: 1, perPage: 2 });

    expect(result.trainingPrograms).toHaveLength(2);
    expect(result.total).toBe(3);
  });

  it('should not list deleted programs', async () => {
    const program = trainingProgramsRepository.items[0];
    program.softDelete();

    const result = await sut.execute({ tenantId });

    expect(result.trainingPrograms).toHaveLength(2);
  });
});
