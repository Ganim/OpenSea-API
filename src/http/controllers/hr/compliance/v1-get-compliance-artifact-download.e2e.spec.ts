import { randomUUID } from 'node:crypto';

import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

/**
 * E2E — GET /v1/hr/compliance/artifacts/:id/download
 *
 * Valida:
 *  - 401 sem token
 *  - 200 happy path com `{ url, expiresAt }` + audit COMPLIANCE_ARTIFACT_DOWNLOADED
 *  - 404 quando artifact id pertence a outro tenant (cross-tenant isolation)
 *  - 404 quando id não existe
 *  - 403 sem permissão `hr.compliance.artifact.download`
 *  - Presigned URL contém `response-content-disposition` com filename AFD_*
 */
describe('Get Compliance Artifact Download URL E2E', () => {
  let tenantId: string;
  let token: string;
  let otherTenantId: string;
  let artifactAfdId: string;
  let otherTenantArtifactId: string;
  let generatedBy: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    generatedBy = (auth.user as any)?.user?.id ?? randomUUID();

    const other = await createAndSetupTenant();
    otherTenantId = other.tenantId;

    // Config mínima para o CNPJ entrar no Content-Disposition
    await prisma.esocialConfig.upsert({
      where: { tenantId },
      create: {
        tenantId,
        environment: 'HOMOLOGACAO',
        employerType: 'CNPJ',
        employerDocument: '12345678000190',
      },
      update: { employerDocument: '12345678000190' },
    });

    artifactAfdId = randomUUID();
    otherTenantArtifactId = randomUUID();
    const hash = 'a'.repeat(64);

    await prisma.complianceArtifact.create({
      data: {
        id: artifactAfdId,
        tenantId,
        type: 'AFD',
        periodStart: new Date('2026-03-01'),
        periodEnd: new Date('2026-03-31'),
        storageKey: `${tenantId}/compliance/afd/2026/03/${artifactAfdId}.txt`,
        contentHash: hash,
        sizeBytes: 1024,
        generatedBy,
        generatedAt: new Date('2026-04-01'),
      },
    });

    await prisma.complianceArtifact.create({
      data: {
        id: otherTenantArtifactId,
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
    await prisma.esocialConfig
      .delete({ where: { tenantId } })
      .catch(() => undefined);
    await prisma.esocialConfig
      .delete({ where: { tenantId: otherTenantId } })
      .catch(() => undefined);
  });

  it('retorna 401 sem token', async () => {
    const response = await request(app.server).get(
      `/v1/hr/compliance/artifacts/${artifactAfdId}/download`,
    );
    expect(response.status).toBe(401);
  });

  it('retorna 200 com url + expiresAt e grava audit log', async () => {
    const response = await request(app.server)
      .get(`/v1/hr/compliance/artifacts/${artifactAfdId}/download`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.url).toMatch(/^https?:\/\/|^file:\/\//);
    expect(response.body.expiresAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
    );

    // Content-Disposition no URL presigned — o fake / real embute o param na URL
    // como `response-content-disposition` com filename amigável.
    const decoded = decodeURIComponent(response.body.url as string);
    // Aceita "AFD_" em qualquer posição (o fake embute no query string, S3 real
    // também — pattern de filename deterministic).
    expect(decoded).toMatch(/AFD_/);

    // Audit log gravado
    const auditRows = await prisma.auditLog.findMany({
      where: {
        tenantId,
        entity: 'COMPLIANCE_ARTIFACT',
        entityId: artifactAfdId,
        action: 'COMPLIANCE_DOWNLOAD',
      },
    });
    expect(auditRows.length).toBeGreaterThanOrEqual(1);
  });

  it('retorna 404 quando o artifact pertence a outro tenant (cross-tenant)', async () => {
    const response = await request(app.server)
      .get(`/v1/hr/compliance/artifacts/${otherTenantArtifactId}/download`)
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(404);
  });

  it('retorna 404 para id inexistente', async () => {
    const response = await request(app.server)
      .get(`/v1/hr/compliance/artifacts/${randomUUID()}/download`)
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(404);
  });

  it('retorna 403 sem permissão hr.compliance.artifact.download', async () => {
    const limited = await createAndAuthenticateUser(app, {
      tenantId,
      permissions: ['hr.compliance.access'], // ACCESS não é suficiente para download
    });
    const response = await request(app.server)
      .get(`/v1/hr/compliance/artifacts/${artifactAfdId}/download`)
      .set('Authorization', `Bearer ${limited.token}`);
    expect(response.status).toBe(403);
  });
});
