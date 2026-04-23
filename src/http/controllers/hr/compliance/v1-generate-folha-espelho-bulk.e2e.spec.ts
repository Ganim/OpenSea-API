import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';

/**
 * E2E — POST /v1/hr/compliance/folhas-espelho/bulk
 *
 * Valida:
 *  - 202 happy path com bulkJobId + employeeCount
 *  - 400 Zod: scope=CUSTOM sem employeeIds
 *  - 400 Zod: scope=DEPARTMENT sem departmentIds
 *  - 400 Zod: competência inválida
 *  - 403 sem permissão
 */
describe('Generate Folha Espelho (bulk) E2E', () => {
  let tenantId: string;
  let token: string;
  let employeeId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;

    const emp = await createEmployeeE2E({ tenantId });
    employeeId = emp.employeeId;
  });

  afterAll(async () => {
    await prisma.complianceArtifact.deleteMany({ where: { tenantId } });
  });

  it('retorna 401 sem token', async () => {
    const response = await request(app.server)
      .post('/v1/hr/compliance/folhas-espelho/bulk')
      .send({ scope: 'ALL', competencia: '2026-03' });
    expect(response.status).toBe(401);
  });

  it('enfileira lote CUSTOM com 1 funcionário → 202 com bulkJobId', async () => {
    const response = await request(app.server)
      .post('/v1/hr/compliance/folhas-espelho/bulk')
      .set('Authorization', `Bearer ${token}`)
      .send({
        scope: 'CUSTOM',
        employeeIds: [employeeId],
        competencia: '2026-03',
      });

    expect(response.status).toBe(202);
    expect(response.body.bulkJobId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    expect(response.body.employeeCount).toBe(1);
    expect(response.body.socketRoom).toBe(`tenant:${tenantId}:hr`);
    expect(response.body.progressEvent).toBe(
      'compliance.folha_espelho.progress',
    );
  });

  it('enfileira lote ALL → 202 (conta funcionários ativos do tenant)', async () => {
    const response = await request(app.server)
      .post('/v1/hr/compliance/folhas-espelho/bulk')
      .set('Authorization', `Bearer ${token}`)
      .send({ scope: 'ALL', competencia: '2026-03' });

    expect(response.status).toBe(202);
    expect(response.body.employeeCount).toBeGreaterThanOrEqual(1);
  });

  it('rejeita 400 quando scope=CUSTOM sem employeeIds', async () => {
    const response = await request(app.server)
      .post('/v1/hr/compliance/folhas-espelho/bulk')
      .set('Authorization', `Bearer ${token}`)
      .send({ scope: 'CUSTOM', competencia: '2026-03' });
    expect([400, 422]).toContain(response.status);
  });

  it('rejeita 400 quando scope=DEPARTMENT sem departmentIds', async () => {
    const response = await request(app.server)
      .post('/v1/hr/compliance/folhas-espelho/bulk')
      .set('Authorization', `Bearer ${token}`)
      .send({ scope: 'DEPARTMENT', competencia: '2026-03' });
    expect([400, 422]).toContain(response.status);
  });

  it('rejeita 400 quando competência inválida', async () => {
    const response = await request(app.server)
      .post('/v1/hr/compliance/folhas-espelho/bulk')
      .set('Authorization', `Bearer ${token}`)
      .send({
        scope: 'CUSTOM',
        employeeIds: [employeeId],
        competencia: 'xxx',
      });
    expect([400, 422]).toContain(response.status);
  });

  it('rejeita 403 quando user não tem permissão hr.compliance.folha-espelho.generate', async () => {
    const limited = await createAndAuthenticateUser(app, {
      tenantId,
      permissions: ['hr.compliance.access'],
    });
    const response = await request(app.server)
      .post('/v1/hr/compliance/folhas-espelho/bulk')
      .set('Authorization', `Bearer ${limited.token}`)
      .send({
        scope: 'CUSTOM',
        employeeIds: [employeeId],
        competencia: '2026-03',
      });
    expect(response.status).toBe(403);
  });
});
