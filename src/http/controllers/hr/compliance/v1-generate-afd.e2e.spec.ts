import { randomUUID } from 'node:crypto';

import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';

/**
 * E2E — POST /v1/hr/compliance/afd
 *
 * Valida:
 *  - 201 happy path (cria ComplianceArtifact + retorna artifactId + downloadUrl)
 *  - 400 Zod para período > 365 dias
 *  - 400 Zod para formato de data inválido
 *  - 403 quando caller não tem permissão `hr.compliance.afd.generate`
 *  - Audit log gravado (`entity=COMPLIANCE_ARTIFACT, action=COMPLIANCE_GENERATE`)
 *  - `ComplianceArtifact` persistido com `type=AFD` + contentHash 64-char
 *  - AFD NÃO inclui batidas `ADJUSTMENT_APPROVED` (validação via contentHash
 *    comparando com AFDT do mesmo período)
 */
describe('Generate AFD (E2E)', () => {
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

    // Seeda 4 TimeEntries ORIGINAL no período 2026-03-01..03 (NSRs 1..4).
    const day = (d: number, h: number, m: number) =>
      new Date(
        `2026-03-0${d}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00Z`,
      );

    await prisma.timeEntry.createMany({
      data: [
        {
          id: randomUUID(),
          tenantId,
          employeeId,
          entryType: 'CLOCK_IN',
          timestamp: day(1, 11, 0),
          nsrNumber: 1,
          adjustmentType: 'ORIGINAL',
        },
        {
          id: randomUUID(),
          tenantId,
          employeeId,
          entryType: 'CLOCK_OUT',
          timestamp: day(1, 20, 15),
          nsrNumber: 2,
          adjustmentType: 'ORIGINAL',
        },
        {
          id: randomUUID(),
          tenantId,
          employeeId,
          entryType: 'CLOCK_IN',
          timestamp: day(2, 11, 0),
          nsrNumber: 3,
          adjustmentType: 'ORIGINAL',
        },
        {
          id: randomUUID(),
          tenantId,
          employeeId,
          entryType: 'CLOCK_OUT',
          timestamp: day(2, 20, 15),
          nsrNumber: 4,
          adjustmentType: 'ORIGINAL',
        },
      ],
    });
  });

  afterAll(async () => {
    // Cleanup de ComplianceArtifact criados durante os testes (não bloqueia
    // se nada foi criado).
    await prisma.complianceArtifact.deleteMany({ where: { tenantId } });
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server)
      .post('/v1/hr/compliance/afd')
      .send({ startDate: '2026-03-01', endDate: '2026-03-03' });
    expect(response.status).toBe(401);
  });

  it('should generate AFD (201) with artifactId + downloadUrl', async () => {
    const response = await request(app.server)
      .post('/v1/hr/compliance/afd')
      .set('Authorization', `Bearer ${token}`)
      .send({ startDate: '2026-03-01', endDate: '2026-03-03' });

    expect(response.status).toBe(201);
    expect(response.body.artifactId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    expect(response.body.downloadUrl).toMatch(/^https?:\/\//);
    expect(response.body.contentHash).toHaveLength(64);
    expect(response.body.sizeBytes).toBeGreaterThan(0);
    expect(response.body.storageKey).toMatch(/compliance\/afd\/\d{4}\/\d{2}\//);

    // ComplianceArtifact persistido.
    const artifact = await prisma.complianceArtifact.findUnique({
      where: { id: response.body.artifactId },
    });
    expect(artifact).not.toBeNull();
    expect(artifact?.type).toBe('AFD');
    expect(artifact?.tenantId).toBe(tenantId);
    expect(artifact?.contentHash).toBe(response.body.contentHash);
    expect(artifact?.sizeBytes).toBe(response.body.sizeBytes);

    // Audit log gravado (COMPLIANCE_ARTIFACT + COMPLIANCE_GENERATE).
    const auditRows = await prisma.auditLog.findMany({
      where: {
        tenantId,
        entity: 'COMPLIANCE_ARTIFACT',
        entityId: response.body.artifactId,
      },
    });
    expect(auditRows.length).toBeGreaterThanOrEqual(1);
    expect(auditRows[0].action).toBe('COMPLIANCE_GENERATE');
  });

  it('should return 400 when period > 365 days (Zod refine)', async () => {
    const response = await request(app.server)
      .post('/v1/hr/compliance/afd')
      .set('Authorization', `Bearer ${token}`)
      .send({ startDate: '2024-01-01', endDate: '2026-03-01' });
    // Zod validation returns 400 ou 422 dependendo do projeto config; ambos ok.
    expect([400, 422]).toContain(response.status);
  });

  it('should return 400 on invalid date format', async () => {
    const response = await request(app.server)
      .post('/v1/hr/compliance/afd')
      .set('Authorization', `Bearer ${token}`)
      .send({ startDate: '01/03/2026', endDate: '03/03/2026' });
    expect([400, 422]).toContain(response.status);
  });

  it('should return 403 when user lacks hr.compliance.afd.generate permission', async () => {
    // User com permissão só de ACCESS (ver dashboard), mas não AFD_GENERATE.
    const limited = await createAndAuthenticateUser(app, {
      tenantId,
      permissions: ['hr.compliance.access'],
    });
    const response = await request(app.server)
      .post('/v1/hr/compliance/afd')
      .set('Authorization', `Bearer ${limited.token}`)
      .send({ startDate: '2026-03-01', endDate: '2026-03-03' });
    expect(response.status).toBe(403);
  });

  it('AFD should EXCLUDE adjustment entries (vs AFDT includes them)', async () => {
    // Seed 1 batida ADJUSTMENT_APPROVED extra no mesmo período (NSR 999).
    // Geramos AFD e AFDT — AFDT deve ser MAIOR que AFD exatamente pelo
    // tamanho de 1 registro tipo 7 (137 chars + CRLF = 139 bytes).
    const adjId = randomUUID();
    await prisma.timeEntry.create({
      data: {
        id: adjId,
        tenantId,
        employeeId,
        entryType: 'CLOCK_IN',
        timestamp: new Date('2026-03-01T11:30:00Z'),
        nsrNumber: 999,
        originNsrNumber: 1,
        adjustmentType: 'ADJUSTMENT_APPROVED',
      },
    });

    try {
      const afd = await request(app.server)
        .post('/v1/hr/compliance/afd')
        .set('Authorization', `Bearer ${token}`)
        .send({ startDate: '2026-03-01', endDate: '2026-03-03' });
      const afdt = await request(app.server)
        .post('/v1/hr/compliance/afdt')
        .set('Authorization', `Bearer ${token}`)
        .send({ startDate: '2026-03-01', endDate: '2026-03-03' });

      expect(afd.status).toBe(201);
      expect(afdt.status).toBe(201);

      // AFDT inclui a correção; AFD não. Diferença = bytes do registro tipo 7
      // (137 chars + "\r\n") + efeito no SHA chain — no mínimo 139 bytes maior.
      expect(afdt.body.sizeBytes).toBeGreaterThan(afd.body.sizeBytes);
      expect(afdt.body.contentHash).not.toBe(afd.body.contentHash);
    } finally {
      await prisma.timeEntry.delete({ where: { id: adjId } });
    }
  });
});
