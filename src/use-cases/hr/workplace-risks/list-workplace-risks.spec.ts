import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryWorkplaceRisksRepository } from '@/repositories/hr/in-memory/in-memory-workplace-risks-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListWorkplaceRisksUseCase } from './list-workplace-risks';

let workplaceRisksRepository: InMemoryWorkplaceRisksRepository;
let sut: ListWorkplaceRisksUseCase;

const TENANT_ID = 'tenant-01';
const safetyProgramId = new UniqueEntityID();

async function seedWorkplaceRisk(
  overrides: Partial<{
    tenantId: string;
    safetyProgramId: UniqueEntityID;
    name: string;
    category: string;
    severity: string;
    isActive: boolean;
  }> = {},
) {
  return workplaceRisksRepository.create({
    tenantId: overrides.tenantId ?? TENANT_ID,
    safetyProgramId: overrides.safetyProgramId ?? safetyProgramId,
    name:
      overrides.name ?? `Risco ${new UniqueEntityID().toString().slice(0, 6)}`,
    category: overrides.category ?? 'FISICO',
    severity: overrides.severity ?? 'MEDIO',
    isActive: overrides.isActive ?? true,
  });
}

describe('ListWorkplaceRisksUseCase', () => {
  beforeEach(() => {
    workplaceRisksRepository = new InMemoryWorkplaceRisksRepository();
    sut = new ListWorkplaceRisksUseCase(workplaceRisksRepository);
  });

  it('should list all risks for a tenant', async () => {
    await seedWorkplaceRisk();
    await seedWorkplaceRisk();
    await seedWorkplaceRisk();

    const { workplaceRisks } = await sut.execute({ tenantId: TENANT_ID });

    expect(workplaceRisks).toHaveLength(3);
  });

  it('should return empty array when tenant has no risks', async () => {
    const { workplaceRisks } = await sut.execute({ tenantId: TENANT_ID });

    expect(workplaceRisks).toHaveLength(0);
  });

  it('should not return risks from other tenants', async () => {
    await seedWorkplaceRisk({ tenantId: 'another-tenant' });
    await seedWorkplaceRisk({ tenantId: TENANT_ID });

    const { workplaceRisks } = await sut.execute({ tenantId: TENANT_ID });

    expect(workplaceRisks).toHaveLength(1);
  });

  it('should filter by safetyProgramId', async () => {
    const targetProgramId = new UniqueEntityID();
    const otherProgramId = new UniqueEntityID();

    await seedWorkplaceRisk({ safetyProgramId: targetProgramId });
    await seedWorkplaceRisk({ safetyProgramId: targetProgramId });
    await seedWorkplaceRisk({ safetyProgramId: otherProgramId });

    const { workplaceRisks } = await sut.execute({
      tenantId: TENANT_ID,
      safetyProgramId: targetProgramId.toString(),
    });

    expect(workplaceRisks).toHaveLength(2);
    workplaceRisks.forEach((risk) => {
      expect(risk.safetyProgramId.equals(targetProgramId)).toBe(true);
    });
  });

  it('should filter by category', async () => {
    await seedWorkplaceRisk({ category: 'FISICO' });
    await seedWorkplaceRisk({ category: 'QUIMICO' });
    await seedWorkplaceRisk({ category: 'FISICO' });

    const { workplaceRisks } = await sut.execute({
      tenantId: TENANT_ID,
      category: 'QUIMICO',
    });

    expect(workplaceRisks).toHaveLength(1);
    expect(workplaceRisks[0].category).toBe('QUIMICO');
  });

  it('should filter by severity', async () => {
    await seedWorkplaceRisk({ severity: 'ALTO' });
    await seedWorkplaceRisk({ severity: 'MEDIO' });
    await seedWorkplaceRisk({ severity: 'CRITICO' });

    const { workplaceRisks } = await sut.execute({
      tenantId: TENANT_ID,
      severity: 'CRITICO',
    });

    expect(workplaceRisks).toHaveLength(1);
    expect(workplaceRisks[0].severity).toBe('CRITICO');
  });

  it('should filter by isActive', async () => {
    await seedWorkplaceRisk({ isActive: true });
    await seedWorkplaceRisk({ isActive: true });
    await seedWorkplaceRisk({ isActive: false });

    const activeRisks = await sut.execute({
      tenantId: TENANT_ID,
      isActive: true,
    });

    expect(activeRisks.workplaceRisks).toHaveLength(2);

    const inactiveRisks = await sut.execute({
      tenantId: TENANT_ID,
      isActive: false,
    });

    expect(inactiveRisks.workplaceRisks).toHaveLength(1);
  });

  it('should combine multiple filters', async () => {
    const programA = new UniqueEntityID();

    await seedWorkplaceRisk({
      safetyProgramId: programA,
      category: 'FISICO',
      severity: 'ALTO',
    });
    await seedWorkplaceRisk({
      safetyProgramId: programA,
      category: 'QUIMICO',
      severity: 'ALTO',
    });
    await seedWorkplaceRisk({
      safetyProgramId: programA,
      category: 'FISICO',
      severity: 'BAIXO',
    });

    const { workplaceRisks } = await sut.execute({
      tenantId: TENANT_ID,
      safetyProgramId: programA.toString(),
      category: 'FISICO',
      severity: 'ALTO',
    });

    expect(workplaceRisks).toHaveLength(1);
  });

  it('should paginate results', async () => {
    for (let i = 0; i < 5; i++) {
      await seedWorkplaceRisk();
    }

    const firstPage = await sut.execute({
      tenantId: TENANT_ID,
      page: 1,
      perPage: 2,
    });

    expect(firstPage.workplaceRisks).toHaveLength(2);

    const secondPage = await sut.execute({
      tenantId: TENANT_ID,
      page: 2,
      perPage: 2,
    });

    expect(secondPage.workplaceRisks).toHaveLength(2);

    const thirdPage = await sut.execute({
      tenantId: TENANT_ID,
      page: 3,
      perPage: 2,
    });

    expect(thirdPage.workplaceRisks).toHaveLength(1);
  });
});
