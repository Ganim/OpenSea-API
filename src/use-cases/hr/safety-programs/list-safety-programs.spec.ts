import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemorySafetyProgramsRepository } from '@/repositories/hr/in-memory/in-memory-safety-programs-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListSafetyProgramsUseCase } from './list-safety-programs';

let safetyProgramsRepository: InMemorySafetyProgramsRepository;
let sut: ListSafetyProgramsUseCase;
const tenantId = new UniqueEntityID().toString();

describe('List Safety Programs Use Case', () => {
  beforeEach(async () => {
    safetyProgramsRepository = new InMemorySafetyProgramsRepository();
    sut = new ListSafetyProgramsUseCase(safetyProgramsRepository);

    await safetyProgramsRepository.create({
      tenantId,
      type: 'PCMSO',
      name: 'PCMSO 2024/2025',
      validFrom: new Date('2024-01-01'),
      validUntil: new Date('2025-01-01'),
      responsibleName: 'Dr. Maria Ferreira',
      responsibleRegistration: 'CRM/SP 987654',
      status: 'ACTIVE',
    });

    await safetyProgramsRepository.create({
      tenantId,
      type: 'PGR',
      name: 'PGR Unidade Central',
      validFrom: new Date('2024-03-01'),
      validUntil: new Date('2025-03-01'),
      responsibleName: 'Eng. Pedro Souza',
      responsibleRegistration: 'CREA/SP 123456',
      status: 'ACTIVE',
    });

    await safetyProgramsRepository.create({
      tenantId,
      type: 'LTCAT',
      name: 'LTCAT 2023',
      validFrom: new Date('2023-01-01'),
      validUntil: new Date('2024-01-01'),
      responsibleName: 'Eng. João Santos',
      responsibleRegistration: 'CREA/RJ 654321',
      status: 'EXPIRED',
    });
  });

  it('should list all safety programs for a tenant', async () => {
    const result = await sut.execute({ tenantId });

    expect(result.safetyPrograms).toHaveLength(3);
  });

  it('should filter by type', async () => {
    const result = await sut.execute({
      tenantId,
      type: 'PCMSO',
    });

    expect(result.safetyPrograms).toHaveLength(1);
    expect(result.safetyPrograms[0].type).toBe('PCMSO');
  });

  it('should filter by status', async () => {
    const result = await sut.execute({
      tenantId,
      status: 'ACTIVE',
    });

    expect(result.safetyPrograms).toHaveLength(2);
    result.safetyPrograms.forEach((program) => {
      expect(program.status).toBe('ACTIVE');
    });
  });

  it('should filter by expired status', async () => {
    const result = await sut.execute({
      tenantId,
      status: 'EXPIRED',
    });

    expect(result.safetyPrograms).toHaveLength(1);
    expect(result.safetyPrograms[0].name).toBe('LTCAT 2023');
  });

  it('should paginate results', async () => {
    const firstPage = await sut.execute({
      tenantId,
      page: 1,
      perPage: 2,
    });

    expect(firstPage.safetyPrograms).toHaveLength(2);

    const secondPage = await sut.execute({
      tenantId,
      page: 2,
      perPage: 2,
    });

    expect(secondPage.safetyPrograms).toHaveLength(1);
  });

  it('should return empty list for tenant with no programs', async () => {
    const emptyTenantId = new UniqueEntityID().toString();

    const result = await sut.execute({ tenantId: emptyTenantId });

    expect(result.safetyPrograms).toHaveLength(0);
  });

  it('should combine type and status filters', async () => {
    const result = await sut.execute({
      tenantId,
      type: 'LTCAT',
      status: 'EXPIRED',
    });

    expect(result.safetyPrograms).toHaveLength(1);
    expect(result.safetyPrograms[0].type).toBe('LTCAT');
    expect(result.safetyPrograms[0].status).toBe('EXPIRED');
  });

  it('should return empty when filters match nothing', async () => {
    const result = await sut.execute({
      tenantId,
      type: 'PPRA',
    });

    expect(result.safetyPrograms).toHaveLength(0);
  });
});
