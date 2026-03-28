import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemorySafetyProgramsRepository } from '@/repositories/hr/in-memory/in-memory-safety-programs-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { DeleteSafetyProgramUseCase } from './delete-safety-program';

let safetyProgramsRepository: InMemorySafetyProgramsRepository;
let sut: DeleteSafetyProgramUseCase;
const tenantId = new UniqueEntityID().toString();
let existingProgramId: string;

describe('Delete Safety Program Use Case', () => {
  beforeEach(async () => {
    safetyProgramsRepository = new InMemorySafetyProgramsRepository();
    sut = new DeleteSafetyProgramUseCase(safetyProgramsRepository);

    const createdProgram = await safetyProgramsRepository.create({
      tenantId,
      type: 'PGR',
      name: 'PGR Unidade Central',
      validFrom: new Date('2024-01-01'),
      validUntil: new Date('2025-01-01'),
      responsibleName: 'Eng. Pedro Souza',
      responsibleRegistration: 'CREA/SP 123456',
      status: 'ACTIVE',
    });

    existingProgramId = createdProgram.id.toString();
  });

  it('should delete a safety program successfully', async () => {
    const result = await sut.execute({
      tenantId,
      programId: existingProgramId,
    });

    expect(result.safetyProgram).toBeDefined();
    expect(result.safetyProgram.id.toString()).toBe(existingProgramId);

    // Verify it was actually deleted
    const findResult = await safetyProgramsRepository.findById(
      new UniqueEntityID(existingProgramId),
      tenantId,
    );
    expect(findResult).toBeNull();
  });

  it('should return the deleted program data', async () => {
    const result = await sut.execute({
      tenantId,
      programId: existingProgramId,
    });

    expect(result.safetyProgram.name).toBe('PGR Unidade Central');
    expect(result.safetyProgram.type).toBe('PGR');
    expect(result.safetyProgram.responsibleName).toBe('Eng. Pedro Souza');
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

    await expect(
      sut.execute({
        tenantId: differentTenantId,
        programId: existingProgramId,
      }),
    ).rejects.toThrow('Programa de segurança não encontrado');
  });

  it('should not find program after deletion', async () => {
    await sut.execute({
      tenantId,
      programId: existingProgramId,
    });

    await expect(
      sut.execute({
        tenantId,
        programId: existingProgramId,
      }),
    ).rejects.toThrow('Programa de segurança não encontrado');
  });
});
