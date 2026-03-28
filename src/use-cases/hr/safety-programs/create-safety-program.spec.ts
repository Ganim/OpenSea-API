import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemorySafetyProgramsRepository } from '@/repositories/hr/in-memory/in-memory-safety-programs-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateSafetyProgramUseCase } from './create-safety-program';

let safetyProgramsRepository: InMemorySafetyProgramsRepository;
let sut: CreateSafetyProgramUseCase;
const tenantId = new UniqueEntityID().toString();

describe('Create Safety Program Use Case', () => {
  beforeEach(() => {
    safetyProgramsRepository = new InMemorySafetyProgramsRepository();
    sut = new CreateSafetyProgramUseCase(safetyProgramsRepository);
  });

  it('should create a safety program successfully', async () => {
    const result = await sut.execute({
      tenantId,
      type: 'PCMSO',
      name: 'PCMSO 2024/2025',
      validFrom: new Date('2024-01-01'),
      validUntil: new Date('2025-01-01'),
      responsibleName: 'Dr. Maria Ferreira',
      responsibleRegistration: 'CRM/SP 987654',
    });

    expect(result.safetyProgram).toBeDefined();
    expect(result.safetyProgram.type).toBe('PCMSO');
    expect(result.safetyProgram.name).toBe('PCMSO 2024/2025');
    expect(result.safetyProgram.responsibleName).toBe('Dr. Maria Ferreira');
    expect(result.safetyProgram.responsibleRegistration).toBe('CRM/SP 987654');
  });

  it('should create a safety program with optional fields', async () => {
    const result = await sut.execute({
      tenantId,
      type: 'PGR',
      name: 'PGR Unidade Central',
      validFrom: new Date('2024-01-01'),
      validUntil: new Date('2025-01-01'),
      responsibleName: 'Eng. Pedro Souza',
      responsibleRegistration: 'CREA/SP 123456',
      documentUrl: 'https://storage.example.com/programs/pgr-2024.pdf',
      status: 'DRAFT',
      notes: 'Programa em revisão pela diretoria',
    });

    expect(result.safetyProgram.documentUrl).toBe(
      'https://storage.example.com/programs/pgr-2024.pdf',
    );
    expect(result.safetyProgram.status).toBe('DRAFT');
    expect(result.safetyProgram.notes).toBe(
      'Programa em revisão pela diretoria',
    );
  });

  it('should throw error when name is empty', async () => {
    await expect(
      sut.execute({
        tenantId,
        type: 'PCMSO',
        name: '',
        validFrom: new Date('2024-01-01'),
        validUntil: new Date('2025-01-01'),
        responsibleName: 'Dr. Maria Ferreira',
        responsibleRegistration: 'CRM/SP 987654',
      }),
    ).rejects.toThrow('O nome do programa é obrigatório');
  });

  it('should throw error when name is only whitespace', async () => {
    await expect(
      sut.execute({
        tenantId,
        type: 'PCMSO',
        name: '   ',
        validFrom: new Date('2024-01-01'),
        validUntil: new Date('2025-01-01'),
        responsibleName: 'Dr. Maria Ferreira',
        responsibleRegistration: 'CRM/SP 987654',
      }),
    ).rejects.toThrow('O nome do programa é obrigatório');
  });

  it('should throw error when responsible name is empty', async () => {
    await expect(
      sut.execute({
        tenantId,
        type: 'PCMSO',
        name: 'PCMSO 2024',
        validFrom: new Date('2024-01-01'),
        validUntil: new Date('2025-01-01'),
        responsibleName: '',
        responsibleRegistration: 'CRM/SP 987654',
      }),
    ).rejects.toThrow('O nome do responsável é obrigatório');
  });

  it('should throw error when responsible registration is empty', async () => {
    await expect(
      sut.execute({
        tenantId,
        type: 'PCMSO',
        name: 'PCMSO 2024',
        validFrom: new Date('2024-01-01'),
        validUntil: new Date('2025-01-01'),
        responsibleName: 'Dr. Maria Ferreira',
        responsibleRegistration: '',
      }),
    ).rejects.toThrow('O registro profissional do responsável é obrigatório');
  });

  it('should throw error when responsible registration is only whitespace', async () => {
    await expect(
      sut.execute({
        tenantId,
        type: 'PCMSO',
        name: 'PCMSO 2024',
        validFrom: new Date('2024-01-01'),
        validUntil: new Date('2025-01-01'),
        responsibleName: 'Dr. Maria Ferreira',
        responsibleRegistration: '   ',
      }),
    ).rejects.toThrow('O registro profissional do responsável é obrigatório');
  });

  it('should throw error when validUntil is before validFrom', async () => {
    await expect(
      sut.execute({
        tenantId,
        type: 'PCMSO',
        name: 'PCMSO 2024',
        validFrom: new Date('2025-01-01'),
        validUntil: new Date('2024-01-01'),
        responsibleName: 'Dr. Maria Ferreira',
        responsibleRegistration: 'CRM/SP 987654',
      }),
    ).rejects.toThrow('A data de validade deve ser posterior à data de início');
  });

  it('should throw error when validUntil equals validFrom', async () => {
    const sameDate = new Date('2024-06-15');

    await expect(
      sut.execute({
        tenantId,
        type: 'PCMSO',
        name: 'PCMSO 2024',
        validFrom: sameDate,
        validUntil: sameDate,
        responsibleName: 'Dr. Maria Ferreira',
        responsibleRegistration: 'CRM/SP 987654',
      }),
    ).rejects.toThrow('A data de validade deve ser posterior à data de início');
  });

  it('should trim name and responsible fields', async () => {
    const result = await sut.execute({
      tenantId,
      type: 'LTCAT',
      name: '  LTCAT 2024  ',
      validFrom: new Date('2024-01-01'),
      validUntil: new Date('2025-01-01'),
      responsibleName: '  Eng. Pedro Souza  ',
      responsibleRegistration: '  CREA/SP 123456  ',
    });

    expect(result.safetyProgram.name).toBe('LTCAT 2024');
    expect(result.safetyProgram.responsibleName).toBe('Eng. Pedro Souza');
    expect(result.safetyProgram.responsibleRegistration).toBe('CREA/SP 123456');
  });

  it('should trim notes when provided', async () => {
    const result = await sut.execute({
      tenantId,
      type: 'PCMSO',
      name: 'PCMSO 2024',
      validFrom: new Date('2024-01-01'),
      validUntil: new Date('2025-01-01'),
      responsibleName: 'Dr. Maria Ferreira',
      responsibleRegistration: 'CRM/SP 987654',
      notes: '  Notas importantes  ',
    });

    expect(result.safetyProgram.notes).toBe('Notas importantes');
  });
});
