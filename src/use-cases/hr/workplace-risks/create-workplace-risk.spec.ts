import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemorySafetyProgramsRepository } from '@/repositories/hr/in-memory/in-memory-safety-programs-repository';
import { InMemoryWorkplaceRisksRepository } from '@/repositories/hr/in-memory/in-memory-workplace-risks-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateWorkplaceRiskUseCase } from './create-workplace-risk';

let workplaceRisksRepository: InMemoryWorkplaceRisksRepository;
let safetyProgramsRepository: InMemorySafetyProgramsRepository;
let sut: CreateWorkplaceRiskUseCase;

const TENANT_ID = 'tenant-01';

async function createTestSafetyProgram(tenantId: string): Promise<string> {
  const program = await safetyProgramsRepository.create({
    tenantId,
    type: 'PPRA',
    name: 'PPRA 2026',
    validFrom: new Date('2026-01-01'),
    validUntil: new Date('2027-01-01'),
    responsibleName: 'Dr. Carlos Segurança',
    responsibleRegistration: 'CRM-12345',
    status: 'ACTIVE',
  });
  return program.id.toString();
}

describe('CreateWorkplaceRiskUseCase', () => {
  beforeEach(() => {
    workplaceRisksRepository = new InMemoryWorkplaceRisksRepository();
    safetyProgramsRepository = new InMemorySafetyProgramsRepository();
    sut = new CreateWorkplaceRiskUseCase(
      workplaceRisksRepository,
      safetyProgramsRepository,
    );
  });

  it('should create a workplace risk successfully', async () => {
    const safetyProgramId = await createTestSafetyProgram(TENANT_ID);

    const { workplaceRisk } = await sut.execute({
      tenantId: TENANT_ID,
      safetyProgramId,
      name: 'Ruído Excessivo',
      category: 'FISICO',
      severity: 'ALTO',
      source: 'Máquinas industriais',
      affectedArea: 'Área de produção',
      controlMeasures: 'Uso de protetor auricular',
      epiRequired: 'Protetor auricular tipo concha',
    });

    expect(workplaceRisk).toBeDefined();
    expect(workplaceRisk.name).toBe('Ruído Excessivo');
    expect(workplaceRisk.category).toBe('FISICO');
    expect(workplaceRisk.severity).toBe('ALTO');
    expect(workplaceRisk.source).toBe('Máquinas industriais');
    expect(workplaceRisk.affectedArea).toBe('Área de produção');
    expect(workplaceRisk.controlMeasures).toBe('Uso de protetor auricular');
    expect(workplaceRisk.epiRequired).toBe('Protetor auricular tipo concha');
    expect(workplaceRisk.tenantId.toString()).toBe(TENANT_ID);
  });

  it('should create a workplace risk with only required fields', async () => {
    const safetyProgramId = await createTestSafetyProgram(TENANT_ID);

    const { workplaceRisk } = await sut.execute({
      tenantId: TENANT_ID,
      safetyProgramId,
      name: 'Exposição a Químicos',
      category: 'QUIMICO',
      severity: 'CRITICO',
    });

    expect(workplaceRisk.name).toBe('Exposição a Químicos');
    expect(workplaceRisk.category).toBe('QUIMICO');
    expect(workplaceRisk.severity).toBe('CRITICO');
    expect(workplaceRisk.source).toBeUndefined();
    expect(workplaceRisk.affectedArea).toBeUndefined();
  });

  it('should trim name and optional text fields', async () => {
    const safetyProgramId = await createTestSafetyProgram(TENANT_ID);

    const { workplaceRisk } = await sut.execute({
      tenantId: TENANT_ID,
      safetyProgramId,
      name: '  Ruído Excessivo  ',
      category: 'FISICO',
      severity: 'ALTO',
      source: '  Máquinas  ',
      affectedArea: '  Produção  ',
      controlMeasures: '  Protetor  ',
      epiRequired: '  Concha  ',
    });

    expect(workplaceRisk.name).toBe('Ruído Excessivo');
    expect(workplaceRisk.source).toBe('Máquinas');
    expect(workplaceRisk.affectedArea).toBe('Produção');
    expect(workplaceRisk.controlMeasures).toBe('Protetor');
    expect(workplaceRisk.epiRequired).toBe('Concha');
  });

  it('should throw BadRequestError when name is empty', async () => {
    const safetyProgramId = await createTestSafetyProgram(TENANT_ID);

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        safetyProgramId,
        name: '',
        category: 'FISICO',
        severity: 'ALTO',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should throw BadRequestError when name is only whitespace', async () => {
    const safetyProgramId = await createTestSafetyProgram(TENANT_ID);

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        safetyProgramId,
        name: '   ',
        category: 'FISICO',
        severity: 'ALTO',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should throw ResourceNotFoundError when safety program does not exist', async () => {
    const nonExistentProgramId = new UniqueEntityID().toString();

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        safetyProgramId: nonExistentProgramId,
        name: 'Ruído Excessivo',
        category: 'FISICO',
        severity: 'ALTO',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw ResourceNotFoundError when safety program belongs to another tenant', async () => {
    const otherTenantProgramId =
      await createTestSafetyProgram('another-tenant');

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        safetyProgramId: otherTenantProgramId,
        name: 'Ruído Excessivo',
        category: 'FISICO',
        severity: 'ALTO',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should persist the risk in the repository', async () => {
    const safetyProgramId = await createTestSafetyProgram(TENANT_ID);

    const { workplaceRisk } = await sut.execute({
      tenantId: TENANT_ID,
      safetyProgramId,
      name: 'Vibração Mecânica',
      category: 'FISICO',
      severity: 'MEDIO',
    });

    const foundRisk = await workplaceRisksRepository.findById(
      workplaceRisk.id,
      TENANT_ID,
    );

    expect(foundRisk).not.toBeNull();
    expect(foundRisk?.name).toBe('Vibração Mecânica');
  });
});
