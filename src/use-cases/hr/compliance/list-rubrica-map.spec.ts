import { beforeEach, describe, expect, it } from 'vitest';

import { InMemoryComplianceRubricaMapRepository } from '@/repositories/hr/in-memory/in-memory-compliance-rubrica-map-repository';

import { ListRubricaMapUseCase } from './list-rubrica-map';
import { UpsertRubricaMapUseCase } from './upsert-rubrica-map';

describe('ListRubricaMapUseCase', () => {
  let repo: InMemoryComplianceRubricaMapRepository;
  let sut: ListRubricaMapUseCase;
  let upsert: UpsertRubricaMapUseCase;

  const TENANT = 'tenant-a';
  const USER = 'user-1';

  beforeEach(() => {
    repo = new InMemoryComplianceRubricaMapRepository();
    sut = new ListRubricaMapUseCase(repo);
    upsert = new UpsertRubricaMapUseCase(repo);
  });

  it('returns empty list + all required gaps when nothing is configured', async () => {
    const result = await sut.execute({ tenantId: TENANT });
    expect(result.items).toEqual([]);
    expect(result.gaps).toEqual(['HE_50', 'HE_100', 'DSR']);
  });

  it('returns all 3 required gaps when only optional concepts are configured', async () => {
    await upsert.execute({
      tenantId: TENANT,
      clrConcept: 'SALARIO_BASE',
      codRubr: '1000',
      ideTabRubr: 'TAB01',
      updatedBy: USER,
    });
    const result = await sut.execute({ tenantId: TENANT });
    expect(result.items).toHaveLength(1);
    expect(result.gaps).toEqual(['HE_50', 'HE_100', 'DSR']);
  });

  it('returns empty gaps when all required concepts are configured', async () => {
    for (const concept of ['HE_50', 'HE_100', 'DSR'] as const) {
      await upsert.execute({
        tenantId: TENANT,
        clrConcept: concept,
        codRubr: concept,
        ideTabRubr: 'TAB01',
        updatedBy: USER,
      });
    }

    const result = await sut.execute({ tenantId: TENANT });
    expect(result.items).toHaveLength(3);
    expect(result.gaps).toEqual([]);
  });

  it('returns only HE_100 as gap when HE_50 + DSR are configured', async () => {
    await upsert.execute({
      tenantId: TENANT,
      clrConcept: 'HE_50',
      codRubr: '5001',
      ideTabRubr: 'TAB01',
      updatedBy: USER,
    });
    await upsert.execute({
      tenantId: TENANT,
      clrConcept: 'DSR',
      codRubr: '8000',
      ideTabRubr: 'TAB01',
      updatedBy: USER,
    });

    const result = await sut.execute({ tenantId: TENANT });
    expect(result.gaps).toEqual(['HE_100']);
  });

  it('isolates tenants (gaps from tenant A do not affect tenant B)', async () => {
    await upsert.execute({
      tenantId: 'tenant-a',
      clrConcept: 'HE_50',
      codRubr: '5001',
      ideTabRubr: 'TAB01',
      updatedBy: USER,
    });

    const a = await sut.execute({ tenantId: 'tenant-a' });
    const b = await sut.execute({ tenantId: 'tenant-b' });

    expect(a.gaps).toEqual(['HE_100', 'DSR']);
    expect(b.gaps).toEqual(['HE_50', 'HE_100', 'DSR']);
  });
});
