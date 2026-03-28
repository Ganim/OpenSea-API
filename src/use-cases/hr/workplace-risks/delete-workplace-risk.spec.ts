import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryWorkplaceRisksRepository } from '@/repositories/hr/in-memory/in-memory-workplace-risks-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { DeleteWorkplaceRiskUseCase } from './delete-workplace-risk';

let workplaceRisksRepository: InMemoryWorkplaceRisksRepository;
let sut: DeleteWorkplaceRiskUseCase;

const TENANT_ID = 'tenant-01';
const safetyProgramId = new UniqueEntityID();

describe('DeleteWorkplaceRiskUseCase', () => {
  beforeEach(() => {
    workplaceRisksRepository = new InMemoryWorkplaceRisksRepository();
    sut = new DeleteWorkplaceRiskUseCase(workplaceRisksRepository);
  });

  it('should delete a workplace risk', async () => {
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
    });

    expect(workplaceRisk.id.equals(createdRisk.id)).toBe(true);
    expect(workplaceRisk.name).toBe('Ruído Excessivo');

    const foundRisk = await workplaceRisksRepository.findById(
      createdRisk.id,
      TENANT_ID,
    );
    expect(foundRisk).toBeNull();
  });

  it('should throw ResourceNotFoundError when risk does not exist', async () => {
    const nonExistentId = new UniqueEntityID().toString();

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        riskId: nonExistentId,
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw ResourceNotFoundError when risk belongs to another tenant', async () => {
    const createdRisk = await workplaceRisksRepository.create({
      tenantId: 'another-tenant',
      safetyProgramId,
      name: 'Risco Outro Tenant',
      category: 'QUIMICO',
      severity: 'CRITICO',
      isActive: true,
    });

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        riskId: createdRisk.id.toString(),
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should only delete the specified risk and preserve others', async () => {
    const riskToKeep = await workplaceRisksRepository.create({
      tenantId: TENANT_ID,
      safetyProgramId,
      name: 'Vibração Mecânica',
      category: 'FISICO',
      severity: 'MEDIO',
      isActive: true,
    });

    const riskToDelete = await workplaceRisksRepository.create({
      tenantId: TENANT_ID,
      safetyProgramId,
      name: 'Exposição a Poeira',
      category: 'QUIMICO',
      severity: 'ALTO',
      isActive: true,
    });

    await sut.execute({
      tenantId: TENANT_ID,
      riskId: riskToDelete.id.toString(),
    });

    const remainingRisk = await workplaceRisksRepository.findById(
      riskToKeep.id,
      TENANT_ID,
    );
    expect(remainingRisk).not.toBeNull();
    expect(remainingRisk?.name).toBe('Vibração Mecânica');

    const deletedRisk = await workplaceRisksRepository.findById(
      riskToDelete.id,
      TENANT_ID,
    );
    expect(deletedRisk).toBeNull();
  });

  it('should delete an inactive risk', async () => {
    const inactiveRisk = await workplaceRisksRepository.create({
      tenantId: TENANT_ID,
      safetyProgramId,
      name: 'Risco Inativo',
      category: 'BIOLOGICO',
      severity: 'BAIXO',
      isActive: false,
    });

    const { workplaceRisk } = await sut.execute({
      tenantId: TENANT_ID,
      riskId: inactiveRisk.id.toString(),
    });

    expect(workplaceRisk.isActive).toBe(false);

    const foundRisk = await workplaceRisksRepository.findById(
      inactiveRisk.id,
      TENANT_ID,
    );
    expect(foundRisk).toBeNull();
  });
});
