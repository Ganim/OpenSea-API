import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';

/**
 * E2E — POST /v1/hr/compliance/folhas-espelho (individual)
 *
 * Valida:
 *  - 201 happy path (cria ComplianceArtifact com filters={employeeId})
 *  - 400 Zod para competência inválida
 *  - 403 sem permissão `hr.compliance.folha-espelho.generate`
 *  - Audit log escrito (COMPLIANCE_ARTIFACT_GENERATED)
 */
describe('Generate Folha Espelho (individual) E2E', () => {
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
      .post('/v1/hr/compliance/folhas-espelho')
      .send({ employeeId, competencia: '2026-03' });
    expect(response.status).toBe(401);
  });

  it('gera folha espelho (201) com artifactId + downloadUrl', async () => {
    const response = await request(app.server)
      .post('/v1/hr/compliance/folhas-espelho')
      .set('Authorization', `Bearer ${token}`)
      .send({ employeeId, competencia: '2026-03' });

    expect(response.status).toBe(201);
    expect(response.body.artifactId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    expect(response.body.downloadUrl).toMatch(/^https?:\/\//);
    expect(response.body.contentHash).toHaveLength(64);
    expect(response.body.sizeBytes).toBeGreaterThan(0);
    expect(response.body.storageKey).toMatch(
      /compliance\/folha-espelho\/2026\/03\//,
    );

    // ComplianceArtifact persistido com filters={employeeId}
    const artifact = await prisma.complianceArtifact.findUnique({
      where: { id: response.body.artifactId },
    });
    expect(artifact).not.toBeNull();
    expect(artifact?.type).toBe('FOLHA_ESPELHO');
    expect(artifact?.tenantId).toBe(tenantId);
    expect(artifact?.competencia).toBe('2026-03');
    expect(artifact?.filters).toMatchObject({ employeeId });

    // Audit log escrito
    const auditRows = await prisma.auditLog.findMany({
      where: {
        tenantId,
        entity: 'COMPLIANCE_ARTIFACT',
        entityId: response.body.artifactId,
      },
    });
    expect(auditRows.length).toBeGreaterThanOrEqual(1);
  });

  it('retorna 400 para competência inválida (regex fail)', async () => {
    const response = await request(app.server)
      .post('/v1/hr/compliance/folhas-espelho')
      .set('Authorization', `Bearer ${token}`)
      .send({ employeeId, competencia: '03-2026' });
    expect([400, 422]).toContain(response.status);
  });

  it('retorna 400 para employeeId inválido (não UUID)', async () => {
    const response = await request(app.server)
      .post('/v1/hr/compliance/folhas-espelho')
      .set('Authorization', `Bearer ${token}`)
      .send({ employeeId: 'not-a-uuid', competencia: '2026-03' });
    expect([400, 422]).toContain(response.status);
  });

  it('retorna 403 quando user não tem permissão hr.compliance.folha-espelho.generate', async () => {
    const limited = await createAndAuthenticateUser(app, {
      tenantId,
      permissions: ['hr.compliance.access'],
    });
    const response = await request(app.server)
      .post('/v1/hr/compliance/folhas-espelho')
      .set('Authorization', `Bearer ${limited.token}`)
      .send({ employeeId, competencia: '2026-03' });
    expect(response.status).toBe(403);
  });
});
