import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryWorkplaceRisksRepository } from '@/repositories/hr/in-memory/in-memory-workplace-risks-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { UpdateWorkplaceRiskUseCase } from './update-workplace-risk';

let workplaceRisksRepository: InMemoryWorkplaceRisksRepository;
let sut: UpdateWorkplaceRiskUseCase;

const TENANT_ID = 'tenant-01';
const safetyProgramId = new UniqueEntityID();

describe('UpdateWorkplaceRiskUseCase', () => {
  beforeEach(() => {
    workplaceRisksRepository = new InMemoryWorkplaceRisksRepository();
    sut = new UpdateWorkplaceRiskUseCase(workplaceRisksRepository);
  });

  it('should update the risk name', async () => {
    const createdRisk = await workplaceRisksRepository.create({
      tenantId: TENANT_ID,
      safetyProgramId,
      name: 'Ruído Excessivo',
      category: 'FISICO',
      severity: 'ALTO',
      isActive: true,
    });

    const { workplaceRisk } = await sut.execute({
      tenantId: TENANT_ID,
      riskId: createdRisk.id.toString(),
      name: 'Ruído Industrial Intenso',
    });

    expect(workplaceRisk.name).toBe('Ruído Industrial Intenso');
  });

  it('should update category and severity', async () => {
    const createdRisk = await workplaceRisksRepository.create({
      tenantId: TENANT_ID,
      safetyProgramId,
      name: 'Risco Genérico',
      category: 'FISICO',
      severity: 'BAIXO',
      isActive: true,
    });

    const { workplaceRisk } = await sut.execute({
      tenantId: TENANT_ID,
      riskId: createdRisk.id.toString(),
      category: 'QUIMICO',
      severity: 'CRITICO',
    });

    expect(workplaceRisk.category).toBe('QUIMICO');
    expect(workplaceRisk.severity).toBe('CRITICO');
  });

  it('should update optional text fields', async () => {
    const createdRisk = await workplaceRisksRepository.create({
      tenantId: TENANT_ID,
      safetyProgramId,
      name: 'Vibração',
      category: 'FISICO',
      severity: 'MEDIO',
      isActive: true,
    });

    const { workplaceRisk } = await sut.execute({
      tenantId: TENANT_ID,
      riskId: createdRisk.id.toString(),
      source: 'Furadeiras pneumáticas',
      affectedArea: 'Setor de montagem',
      controlMeasures: 'Rodízio de funções e luvas anti-vibração',
      epiRequired: 'Luva anti-vibração',
    });

    expect(workplaceRisk.source).toBe('Furadeiras pneumáticas');
    expect(workplaceRisk.affectedArea).toBe('Setor de montagem');
    expect(workplaceRisk.controlMeasures).toBe(
      'Rodízio de funções e luvas anti-vibração',
    );
    expect(workplaceRisk.epiRequired).toBe('Luva anti-vibração');
  });

  it('should deactivate a risk', async () => {
    const createdRisk = await workplaceRisksRepository.create({
      tenantId: TENANT_ID,
      safetyProgramId,
      name: 'Risco Antigo',
      category: 'FISICO',
      severity: 'BAIXO',
      isActive: true,
    });

    const { workplaceRisk } = await sut.execute({
      tenantId: TENANT_ID,
      riskId: createdRisk.id.toString(),
      isActive: false,
    });

    expect(workplaceRisk.isActive).toBe(false);
  });

  it('should trim text fields on update', async () => {
    const createdRisk = await workplaceRisksRepository.create({
      tenantId: TENANT_ID,
      safetyProgramId,
      name: 'Risco Original',
      category: 'FISICO',
      severity: 'ALTO',
      isActive: true,
    });

    const { workplaceRisk } = await sut.execute({
      tenantId: TENANT_ID,
      riskId: createdRisk.id.toString(),
      name: '  Nome Atualizado  ',
      source: '  Fonte Atualizada  ',
      affectedArea: '  Área Atualizada  ',
      controlMeasures: '  Medidas Atualizadas  ',
      epiRequired: '  EPI Atualizado  ',
    });

    expect(workplaceRisk.name).toBe('Nome Atualizado');
    expect(workplaceRisk.source).toBe('Fonte Atualizada');
    expect(workplaceRisk.affectedArea).toBe('Área Atualizada');
    expect(workplaceRisk.controlMeasures).toBe('Medidas Atualizadas');
    expect(workplaceRisk.epiRequired).toBe('EPI Atualizado');
  });

  it('should preserve unchanged fields', async () => {
    const createdRisk = await workplaceRisksRepository.create({
      tenantId: TENANT_ID,
      safetyProgramId,
      name: 'Ruído Excessivo',
      category: 'FISICO',
      severity: 'ALTO',
      source: 'Máquinas',
      affectedArea: 'Produção',
      controlMeasures: 'Protetor auricular',
      epiRequired: 'Concha',
      isActive: true,
    });

    const { workplaceRisk } = await sut.execute({
      tenantId: TENANT_ID,
      riskId: createdRisk.id.toString(),
      name: 'Ruído Atualizado',
    });

    expect(workplaceRisk.name).toBe('Ruído Atualizado');
    expect(workplaceRisk.category).toBe('FISICO');
    expect(workplaceRisk.severity).toBe('ALTO');
    expect(workplaceRisk.source).toBe('Máquinas');
    expect(workplaceRisk.affectedArea).toBe('Produção');
    expect(workplaceRisk.isActive).toBe(true);
  });

  it('should throw ResourceNotFoundError when risk does not exist', async () => {
    const nonExistentId = new UniqueEntityID().toString();

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        riskId: nonExistentId,
        name: 'Tentativa',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw ResourceNotFoundError when risk belongs to another tenant', async () => {
    const createdRisk = await workplaceRisksRepository.create({
      tenantId: 'another-tenant',
      safetyProgramId,
      name: 'Risco Outro Tenant',
      category: 'QUIMICO',
      severity: 'ALTO',
      isActive: true,
    });

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        riskId: createdRisk.id.toString(),
        name: 'Tentativa de Update',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
