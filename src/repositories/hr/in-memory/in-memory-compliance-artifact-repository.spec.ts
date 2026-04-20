import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { ComplianceArtifact } from '@/entities/hr/compliance-artifact';
import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryComplianceArtifactRepository } from './in-memory-compliance-artifact-repository';

const TENANT_A = 'tenant-a';
const TENANT_B = 'tenant-b';

function makeArtifact(overrides: {
  id?: string;
  tenantId?: string;
  type?: 'AFD' | 'AFDT' | 'FOLHA_ESPELHO' | 'RECIBO' | 'S1200_XML';
  competencia?: string;
  periodStart?: Date;
  periodEnd?: Date;
  generatedAt?: Date;
  deleted?: boolean;
}) {
  const artifact = ComplianceArtifact.create(
    {
      tenantId: new UniqueEntityID(overrides.tenantId ?? TENANT_A),
      type: overrides.type ?? 'AFD',
      periodStart: overrides.periodStart,
      periodEnd: overrides.periodEnd,
      competencia: overrides.competencia,
      storageKey: `compliance/${overrides.id ?? 'art'}.bin`,
      contentHash: 'a'.repeat(64),
      sizeBytes: 100,
      generatedBy: new UniqueEntityID('user-rh'),
      generatedAt: overrides.generatedAt ?? new Date(),
    },
    overrides.id ? new UniqueEntityID(overrides.id) : undefined,
  );
  if (overrides.deleted) {
    artifact.softDelete();
  }
  return artifact;
}

describe('InMemoryComplianceArtifactRepository', () => {
  let repo: InMemoryComplianceArtifactRepository;

  beforeEach(() => {
    repo = new InMemoryComplianceArtifactRepository();
  });

  describe('create + findById', () => {
    it('persiste e recupera por id + tenantId', async () => {
      const artifact = makeArtifact({ id: 'art-1' });
      await repo.create(artifact);

      const found = await repo.findById('art-1', TENANT_A);
      expect(found).not.toBeNull();
      expect(found?.id.toString()).toBe('art-1');
    });

    it('isolamento de tenant — findById com tenant errado retorna null', async () => {
      await repo.create(makeArtifact({ id: 'art-1', tenantId: TENANT_A }));

      const found = await repo.findById('art-1', TENANT_B);
      expect(found).toBeNull();
    });

    it('soft-deleted é filtrado por findById', async () => {
      await repo.create(makeArtifact({ id: 'art-1', deleted: true }));

      const found = await repo.findById('art-1', TENANT_A);
      expect(found).toBeNull();
    });
  });

  describe('findByIdWithoutTenant', () => {
    it('encontra independente de tenant E inclui soft-deleted', async () => {
      await repo.create(makeArtifact({ id: 'art-1', tenantId: TENANT_A }));
      await repo.create(
        makeArtifact({ id: 'art-2', tenantId: TENANT_B, deleted: true }),
      );

      expect((await repo.findByIdWithoutTenant('art-1'))?.id.toString()).toBe(
        'art-1',
      );
      expect((await repo.findByIdWithoutTenant('art-2'))?.id.toString()).toBe(
        'art-2',
      );
    });
  });

  describe('findManyByTenant', () => {
    it('retorna apenas artefatos do tenant solicitado', async () => {
      await repo.create(makeArtifact({ id: 'a1', tenantId: TENANT_A }));
      await repo.create(makeArtifact({ id: 'a2', tenantId: TENANT_A }));
      await repo.create(makeArtifact({ id: 'b1', tenantId: TENANT_B }));

      const result = await repo.findManyByTenant({ tenantId: TENANT_A });

      expect(result.total).toBe(2);
      expect(
        result.items.every((i) => i.tenantId.toString() === TENANT_A),
      ).toBe(true);
    });

    it('exclui soft-deleted', async () => {
      await repo.create(makeArtifact({ id: 'a1' }));
      await repo.create(makeArtifact({ id: 'a2', deleted: true }));

      const result = await repo.findManyByTenant({ tenantId: TENANT_A });

      expect(result.total).toBe(1);
      expect(result.items[0].id.toString()).toBe('a1');
    });

    it('filtro por type', async () => {
      await repo.create(makeArtifact({ id: 'afd', type: 'AFD' }));
      await repo.create(makeArtifact({ id: 'afdt', type: 'AFDT' }));
      await repo.create(makeArtifact({ id: 'folha', type: 'FOLHA_ESPELHO' }));

      const result = await repo.findManyByTenant({
        tenantId: TENANT_A,
        filters: { type: 'AFD' },
      });

      expect(result.total).toBe(1);
      expect(result.items[0].type).toBe('AFD');
    });

    it('filtro por competencia', async () => {
      await repo.create(makeArtifact({ id: 'a1', competencia: '2026-03' }));
      await repo.create(makeArtifact({ id: 'a2', competencia: '2026-04' }));
      await repo.create(makeArtifact({ id: 'a3', competencia: '2026-04' }));

      const result = await repo.findManyByTenant({
        tenantId: TENANT_A,
        filters: { competencia: '2026-04' },
      });

      expect(result.total).toBe(2);
    });

    it('combina filtros (type + competencia)', async () => {
      await repo.create(
        makeArtifact({ id: 'a1', type: 'AFD', competencia: '2026-04' }),
      );
      await repo.create(
        makeArtifact({ id: 'a2', type: 'AFDT', competencia: '2026-04' }),
      );
      await repo.create(
        makeArtifact({ id: 'a3', type: 'AFD', competencia: '2026-03' }),
      );

      const result = await repo.findManyByTenant({
        tenantId: TENANT_A,
        filters: { type: 'AFD', competencia: '2026-04' },
      });

      expect(result.total).toBe(1);
      expect(result.items[0].id.toString()).toBe('a1');
    });

    it('ordena por generatedAt DESC (mais recente primeiro)', async () => {
      await repo.create(
        makeArtifact({
          id: 'old',
          generatedAt: new Date('2026-01-01T00:00:00Z'),
        }),
      );
      await repo.create(
        makeArtifact({
          id: 'new',
          generatedAt: new Date('2026-04-01T00:00:00Z'),
        }),
      );
      await repo.create(
        makeArtifact({
          id: 'mid',
          generatedAt: new Date('2026-02-15T00:00:00Z'),
        }),
      );

      const result = await repo.findManyByTenant({ tenantId: TENANT_A });

      expect(result.items.map((i) => i.id.toString())).toEqual([
        'new',
        'mid',
        'old',
      ]);
    });

    it('paginação respeitada (page=2, limit=2)', async () => {
      for (let i = 0; i < 5; i++) {
        await repo.create(
          makeArtifact({
            id: `a${i}`,
            generatedAt: new Date(2026, 0, 1 + i),
          }),
        );
      }

      const page1 = await repo.findManyByTenant({
        tenantId: TENANT_A,
        filters: { page: 1, limit: 2 },
      });
      const page2 = await repo.findManyByTenant({
        tenantId: TENANT_A,
        filters: { page: 2, limit: 2 },
      });

      expect(page1.total).toBe(5);
      expect(page1.items).toHaveLength(2);
      expect(page2.total).toBe(5);
      expect(page2.items).toHaveLength(2);
      expect(page1.items[0].id.toString()).not.toBe(
        page2.items[0].id.toString(),
      );
    });

    it('default limit=50 e page=1 quando filtros omitidos', async () => {
      for (let i = 0; i < 60; i++) {
        await repo.create(
          makeArtifact({
            id: `a${i}`,
            generatedAt: new Date(2026, 0, 1, i),
          }),
        );
      }

      const result = await repo.findManyByTenant({ tenantId: TENANT_A });

      expect(result.total).toBe(60);
      expect(result.items).toHaveLength(50);
    });
  });

  describe('softDelete', () => {
    it('marca como deletado e retira de findById/findManyByTenant', async () => {
      await repo.create(makeArtifact({ id: 'a1' }));

      await repo.softDelete('a1', TENANT_A);

      expect(await repo.findById('a1', TENANT_A)).toBeNull();
      const list = await repo.findManyByTenant({ tenantId: TENANT_A });
      expect(list.total).toBe(0);
    });

    it('não afeta artefato de outro tenant', async () => {
      await repo.create(makeArtifact({ id: 'a1', tenantId: TENANT_A }));

      await repo.softDelete('a1', TENANT_B); // tenant errado

      expect(await repo.findById('a1', TENANT_A)).not.toBeNull();
    });

    it('é idempotente — softDelete em deletado é no-op', async () => {
      await repo.create(makeArtifact({ id: 'a1', deleted: true }));

      await repo.softDelete('a1', TENANT_A);

      // ainda deletado, sem erros
      expect(await repo.findById('a1', TENANT_A)).toBeNull();
    });
  });
});
