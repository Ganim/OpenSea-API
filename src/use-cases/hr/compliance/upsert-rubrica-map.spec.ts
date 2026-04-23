import { beforeEach, describe, expect, it } from 'vitest';

import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryComplianceRubricaMapRepository } from '@/repositories/hr/in-memory/in-memory-compliance-rubrica-map-repository';

import { UpsertRubricaMapUseCase } from './upsert-rubrica-map';

describe('UpsertRubricaMapUseCase', () => {
  let repo: InMemoryComplianceRubricaMapRepository;
  let sut: UpsertRubricaMapUseCase;

  const TENANT_A = 'tenant-a';
  const TENANT_B = 'tenant-b';
  const USER = 'user-1';

  beforeEach(() => {
    repo = new InMemoryComplianceRubricaMapRepository();
    sut = new UpsertRubricaMapUseCase(repo);
  });

  it('creates a new rubrica map when concept is unmapped (first write)', async () => {
    const result = await sut.execute({
      tenantId: TENANT_A,
      clrConcept: 'HE_50',
      codRubr: 'HE50',
      ideTabRubr: 'TAB01',
      indApurIR: 0,
      updatedBy: USER,
    });

    expect(result.created).toBe(true);
    expect(result.rubricaMap.clrConcept).toBe('HE_50');
    expect(result.rubricaMap.codRubr).toBe('HE50');
    expect(result.rubricaMap.ideTabRubr).toBe('TAB01');
    expect(result.rubricaMap.indApurIR).toBe(0);
    expect(result.rubricaMap.tenantId.toString()).toBe(TENANT_A);
  });

  it('updates existing mapping and flags created=false (second write)', async () => {
    await sut.execute({
      tenantId: TENANT_A,
      clrConcept: 'DSR',
      codRubr: 'OLD',
      ideTabRubr: 'TAB01',
      updatedBy: USER,
    });

    const result = await sut.execute({
      tenantId: TENANT_A,
      clrConcept: 'DSR',
      codRubr: 'NEW',
      ideTabRubr: 'TAB02',
      updatedBy: USER,
    });

    expect(result.created).toBe(false);
    expect(result.rubricaMap.codRubr).toBe('NEW');
    expect(result.rubricaMap.ideTabRubr).toBe('TAB02');
    // Still only 1 row for the tenant.
    const all = await repo.findAllByTenant(TENANT_A);
    expect(all).toHaveLength(1);
  });

  it('is tenant-scoped (same concept in two tenants creates two rows)', async () => {
    await sut.execute({
      tenantId: TENANT_A,
      clrConcept: 'HE_100',
      codRubr: 'A_HE100',
      ideTabRubr: 'A',
      updatedBy: USER,
    });
    await sut.execute({
      tenantId: TENANT_B,
      clrConcept: 'HE_100',
      codRubr: 'B_HE100',
      ideTabRubr: 'B',
      updatedBy: USER,
    });

    const a = await repo.findByTenantAndConcept(TENANT_A, 'HE_100');
    const b = await repo.findByTenantAndConcept(TENANT_B, 'HE_100');
    expect(a?.codRubr).toBe('A_HE100');
    expect(b?.codRubr).toBe('B_HE100');
  });

  it('rejects invalid concept with BadRequestError', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_A,
        // @ts-expect-error intentional invalid
        clrConcept: 'NOT_A_CONCEPT',
        codRubr: 'X',
        ideTabRubr: 'Y',
        updatedBy: USER,
      }),
    ).rejects.toThrow();
  });

  it('rejects codRubr with >16 chars', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_A,
        clrConcept: 'FERIAS',
        codRubr: 'X'.repeat(17),
        ideTabRubr: 'Y',
        updatedBy: USER,
      }),
    ).rejects.toThrow();
  });

  it('accepts updatedBy as UniqueEntityID too', async () => {
    const user = new UniqueEntityID('user-2');
    const result = await sut.execute({
      tenantId: TENANT_A,
      clrConcept: 'SALARIO_BASE',
      codRubr: '1000',
      ideTabRubr: 'TAB01',
      updatedBy: user,
    });
    expect(result.rubricaMap.updatedBy.toString()).toBe('user-2');
  });
});
