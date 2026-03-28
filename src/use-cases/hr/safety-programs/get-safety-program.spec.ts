import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemorySafetyProgramsRepository } from '@/repositories/hr/in-memory/in-memory-safety-programs-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetSafetyProgramUseCase } from './get-safety-program';

let safetyProgramsRepository: InMemorySafetyProgramsRepository;
let sut: GetSafetyProgramUseCase;
const tenantId = new UniqueEntityID().toString();

describe('Get Safety Program Use Case', () => {
  beforeEach(() => {
    safetyProgramsRepository = new InMemorySafetyProgramsRepository();
    sut = new GetSafetyProgramUseCase(safetyProgramsRepository);
  });

  it('should get a safety program by id', async () => {
    const createdProgram = await safetyProgramsRepository.create({
      tenantId,
      type: 'PCMSO',
      name: 'PCMSO 2024/2025',
      validFrom: new Date('2024-01-01'),
      validUntil: new Date('2025-01-01'),
      responsibleName: 'Dr. Maria Ferreira',
      responsibleRegistration: 'CRM/SP 987654',
    });

    const result = await sut.execute({
      tenantId,
      programId: createdProgram.id.toString(),
    });

    expect(result.safetyProgram).toBeDefined();
    expect(result.safetyProgram.id.equals(createdProgram.id)).toBe(true);
    expect(result.safetyProgram.name).toBe('PCMSO 2024/2025');
    expect(result.safetyProgram.type).toBe('PCMSO');
  });

  it('should throw error when program does not exist', async () => {
    const nonExistentProgramId = new UniqueEntityID().toString();

    await expect(
      sut.execute({
        tenantId,
        programId: nonExistentProgramId,
      }),
    ).rejects.toThrow('Programa de segurança não encontrado');
  });

  it('should throw error when program belongs to different tenant', async () => {
    const differentTenantId = new UniqueEntityID().toString();

    const createdProgram = await safetyProgramsRepository.create({
      tenantId,
      type: 'PGR',
      name: 'PGR Unidade Central',
      validFrom: new Date('2024-01-01'),
      validUntil: new Date('2025-01-01'),
      responsibleName: 'Eng. Pedro Souza',
      responsibleRegistration: 'CREA/SP 123456',
    });

    await expect(
      sut.execute({
        tenantId: differentTenantId,
        programId: createdProgram.id.toString(),
      }),
    ).rejects.toThrow('Programa de segurança não encontrado');
  });
});
