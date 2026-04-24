import { randomUUID } from 'node:crypto';

import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

/**
 * E2E — GET /v1/hr/compliance/artifacts
 *
 * Valida:
 *  - 401 sem token
 *  - 200 sem filtros: retorna todos os artefatos do tenant
 *  - 200 com filtro `type`: isolado corretamente
 *  - 200 com paginação `page` + `limit` (meta.total correto)
 *  - 403 sem permissão `hr.compliance.access`
 *  - Cross-tenant isolation: artefato de outro tenant NÃO aparece
 */
describe('List Compliance Artifacts E2E', () => {
  let tenantId: string;
  let token: string;
  let otherTenantId: string;
  let generatedBy: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    generatedBy = (auth.user as any)?.user?.id ?? randomUUID();

    // Tenant separado para validar cross-tenant isolation
    const other = await createAndSetupTenant();
    otherTenantId = other.tenantId;

    // Seeda artefatos no tenant alvo: 2 AFD + 2 RECIBO + 1 FOLHA
    const afd1 = randomUUID();
    const afd2 = randomUUID();
    const rec1 = randomUUID();
    const rec2 = randomUUID();
    const folha1 = randomUUID();
    const hash = 'a'.repeat(64);

    await prisma.complianceArtifact.createMany({
      data: [
        {
          id: afd1,
          tenantId,
          type: 'AFD',
          periodStart: new Date('2026-03-01'),
          periodEnd: new Date('2026-03-31'),
          storageKey: `${tenantId}/compliance/afd/2026/03/${afd1}.txt`,
          contentHash: hash,
          sizeBytes: 1024,
          generatedBy,
          generatedAt: new Date('2026-04-01'),
        },
        {
          id: afd2,
          tenantId,
          type: 'AFD',
          periodStart: new Date('2026-02-01'),
          periodEnd: new Date('2026-02-28'),
          storageKey: `${tenantId}/compliance/afd/2026/02/${afd2}.txt`,
          contentHash: hash,
          sizeBytes: 950,
          generatedBy,
          generatedAt: new Date('2026-03-02'),
        },
        {
          id: rec1,
          tenantId,
          type: 'RECIBO',
          storageKey: `${tenantId}/compliance/recibo/2026/03/${rec1}.pdf`,
          contentHash: hash,
          sizeBytes: 5000,
          generatedBy,
          generatedAt: new Date('2026-03-10'),
        },
        {
          id: rec2,
          tenantId,
          type: 'RECIBO',
          storageKey: `${tenantId}/compliance/recibo/2026/03/${rec2}.pdf`,
          contentHash: hash,
          sizeBytes: 5100,
          generatedBy,
          generatedAt: new Date('2026-03-11'),
        },
        {
          id: folha1,
          tenantId,
          type: 'FOLHA_ESPELHO',
          competencia: '2026-03',
          filters: { employeeId: randomUUID() },
          storageKey: `${tenantId}/compliance/folha-espelho/2026/03/${folha1}.pdf`,
          contentHash: hash,
          sizeBytes: 7500,
          generatedBy,
          generatedAt: new Date('2026-04-02'),
        },
      ],
    });

    // Seed de artefato no OUTRO tenant para validar isolamento
    await prisma.complianceArtifact.create({
      data: {
        id: randomUUID(),
        tenantId: otherTenantId,
        type: 'AFD',
        periodStart: new Date('2026-03-01'),
        periodEnd: new Date('2026-03-31'),
        storageKey: `${otherTenantId}/compliance/afd/2026/03/leak.txt`,
        contentHash: hash,
        sizeBytes: 999,
        generatedBy,
        generatedAt: new Date('2026-04-01'),
      },
    });
  });

  afterAll(async () => {
    await prisma.complianceArtifact.deleteMany({
      where: { tenantId: { in: [tenantId, otherTenantId] } },
    });
  });

  it('retorna 401 sem token', async () => {
    const response = await request(app.server).get(
      '/v1/hr/compliance/artifacts',
    );
    expect(response.status).toBe(401);
  });

  it('retorna 200 com todos os artefatos do tenant sem filtros', async () => {
    const response = await request(app.server)
      .get('/v1/hr/compliance/artifacts')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(5);
    expect(response.body.meta).toMatchObject({ page: 1, limit: 50, total: 5 });
    // Nenhum artefato do outro tenant deve vazar
    const storageKeys = (
      response.body.items as Array<{ storageKey: string }>
    ).map((i) => i.storageKey);
    expect(storageKeys.every((k) => k.startsWith(tenantId))).toBe(true);
  });

  it('filtra por type=AFD', async () => {
    const response = await request(app.server)
      .get('/v1/hr/compliance/artifacts?type=AFD')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(2);
    expect(
      response.body.items.every((i: { type: string }) => i.type === 'AFD'),
    ).toBe(true);
  });

  it('paginação page=1&limit=2 retorna 2 itens mas total=5', async () => {
    const response = await request(app.server)
      .get('/v1/hr/compliance/artifacts?page=1&limit=2')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(2);
    expect(response.body.meta.total).toBe(5);
    expect(response.body.meta.pages).toBe(3);
  });

  it('retorna 403 sem permissão hr.compliance.access', async () => {
    const limited = await createAndAuthenticateUser(app, {
      tenantId,
      permissions: ['hr.employees.access'], // permissão arbitrária que não é compliance
    });
    const response = await request(app.server)
      .get('/v1/hr/compliance/artifacts')
      .set('Authorization', `Bearer ${limited.token}`);
    expect(response.status).toBe(403);
  });

  it('competencia filter retorna só FOLHA com competencia=2026-03', async () => {
    const response = await request(app.server)
      .get('/v1/hr/compliance/artifacts?competencia=2026-03')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(1);
    expect(response.body.items[0].type).toBe('FOLHA_ESPELHO');
    expect(response.body.items[0].competencia).toBe('2026-03');
  });
});
