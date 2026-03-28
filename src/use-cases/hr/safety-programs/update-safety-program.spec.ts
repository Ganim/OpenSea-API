import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemorySafetyProgramsRepository } from '@/repositories/hr/in-memory/in-memory-safety-programs-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { UpdateSafetyProgramUseCase } from './update-safety-program';

let safetyProgramsRepository: InMemorySafetyProgramsRepository;
let sut: UpdateSafetyProgramUseCase;
const tenantId = new UniqueEntityID().toString();
let existingProgramId: string;

describe('Update Safety Program Use Case', () => {
  beforeEach(async () => {
    safetyProgramsRepository = new InMemorySafetyProgramsRepository();
    sut = new UpdateSafetyProgramUseCase(safetyProgramsRepository);

    const createdProgram = await safetyProgramsRepository.create({
      tenantId,
      type: 'PCMSO',
      name: 'PCMSO 2024/2025',
      validFrom: new Date('2024-01-01'),
      validUntil: new Date('2025-01-01'),
      responsibleName: 'Dr. Maria Ferreira',
      responsibleRegistration: 'CRM/SP 987654',
      status: 'ACTIVE',
    });

    existingProgramId = createdProgram.id.toString();
  });

  it('should update a safety program successfully', async () => {
    const result = await sut.execute({
      tenantId,
      programId: existingProgramId,
      name: 'PCMSO 2024/2025 - Revisado',
      status: 'EXPIRED',
    });

    expect(result.safetyProgram).toBeDefined();
    expect(result.safetyProgram.name).toBe('PCMSO 2024/2025 - Revisado');
    expect(result.safetyProgram.status).toBe('EXPIRED');
  });

  it('should update responsible information', async () => {
    const result = await sut.execute({
      tenantId,
      programId: existingProgramId,
      responsibleName: 'Dr. Carlos Lima',
      responsibleRegistration: 'CRM/RJ 111222',
    });

    expect(result.safetyProgram.responsibleName).toBe('Dr. Carlos Lima');
    expect(result.safetyProgram.responsibleRegistration).toBe('CRM/RJ 111222');
  });

  it('should update validity dates', async () => {
    const newValidFrom = new Date('2024-06-01');
    const newValidUntil = new Date('2025-06-01');

    const result = await sut.execute({
      tenantId,
      programId: existingProgramId,
      validFrom: newValidFrom,
      validUntil: newValidUntil,
    });

    expect(result.safetyProgram.validFrom).toEqual(newValidFrom);
    expect(result.safetyProgram.validUntil).toEqual(newValidUntil);
  });

  it('should update document URL and notes', async () => {
    const result = await sut.execute({
      tenantId,
      programId: existingProgramId,
      documentUrl: 'https://storage.example.com/programs/pcmso-rev2.pdf',
      notes: 'Revisão aprovada pelo comitê',
    });

    expect(result.safetyProgram.documentUrl).toBe(
      'https://storage.example.com/programs/pcmso-rev2.pdf',
    );
    expect(result.safetyProgram.notes).toBe('Revisão aprovada pelo comitê');
  });

  it('should trim updated string fields', async () => {
    const result = await sut.execute({
      tenantId,
      programId: existingProgramId,
      name: '  PCMSO Atualizado  ',
      responsibleName: '  Dr. Nova Responsável  ',
      responsibleRegistration: '  CRM/MG 333444  ',
      notes: '  Notas trimmed  ',
    });

    expect(result.safetyProgram.name).toBe('PCMSO Atualizado');
    expect(result.safetyProgram.responsibleName).toBe('Dr. Nova Responsável');
    expect(result.safetyProgram.responsibleRegistration).toBe('CRM/MG 333444');
    expect(result.safetyProgram.notes).toBe('Notas trimmed');
  });

  it('should throw error when program does not exist', async () => {
    const nonExistentProgramId = new UniqueEntityID().toString();

    await expect(
      sut.execute({
        tenantId,
        programId: nonExistentProgramId,
        name: 'Updated Name',
      }),
    ).rejects.toThrow('Programa de segurança não encontrado');
  });

  it('should throw error when program belongs to different tenant', async () => {
    const differentTenantId = new UniqueEntityID().toString();

    await expect(
      sut.execute({
        tenantId: differentTenantId,
        programId: existingProgramId,
        name: 'Updated Name',
      }),
    ).rejects.toThrow('Programa de segurança não encontrado');
  });

  it('should preserve unchanged fields during partial update', async () => {
    const result = await sut.execute({
      tenantId,
      programId: existingProgramId,
      notes: 'Apenas notas foram alteradas',
    });

    expect(result.safetyProgram.type).toBe('PCMSO');
    expect(result.safetyProgram.name).toBe('PCMSO 2024/2025');
    expect(result.safetyProgram.responsibleName).toBe('Dr. Maria Ferreira');
    expect(result.safetyProgram.status).toBe('ACTIVE');
    expect(result.safetyProgram.notes).toBe('Apenas notas foram alteradas');
  });
});
