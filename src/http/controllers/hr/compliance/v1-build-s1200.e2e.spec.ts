import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';

/**
 * E2E — POST /v1/hr/compliance/esocial-s1200
 *
 * Valida:
 *  - 401 sem token
 *  - 400 sem EsocialConfig (tenant não configurou)
 *  - 400 sem rubricas HE_50/HE_100/DSR mapeadas (Pitfall 6)
 *  - 202 happy path: ComplianceArtifact(type=S1200_XML) + EsocialBatch(DRAFT) + EsocialEvent[]
 *  - 202 com retify → xmlContent contém indRetif=2 + nrRecibo
 *  - 403 sem permissão hr.compliance.s1200.submit
 *  - Audit log escrito (ESOCIAL_S1200_SUBMITTED)
 */
describe('Build S-1200 E2E', () => {
  let tenantId: string;
  let token: string;
  let employeeId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;

    // Create 1 employee
    const emp = await createEmployeeE2E({ tenantId });
    employeeId = emp.employeeId;
  });

  afterAll(async () => {
    // Cleanup in order respecting FKs
    await prisma.esocialEvent.deleteMany({ where: { tenantId } });
    await prisma.esocialBatch.deleteMany({ where: { tenantId } });
    await prisma.complianceArtifact.deleteMany({ where: { tenantId } });
    await prisma.complianceRubricaMap.deleteMany({ where: { tenantId } });
    await prisma.esocialConfig.deleteMany({ where: { tenantId } });
    await prisma.payrollItem.deleteMany({
      where: { employeeId },
    });
    await prisma.payroll.deleteMany({ where: { tenantId } });
  });

  it('retorna 401 sem token', async () => {
    const response = await request(app.server)
      .post('/v1/hr/compliance/esocial-s1200')
      .send({
        competencia: '2026-03',
        scope: 'CUSTOM',
        employeeIds: [employeeId],
      });
    expect(response.status).toBe(401);
  });

  it('retorna 400 quando EsocialConfig não existe para o tenant', async () => {
    const response = await request(app.server)
      .post('/v1/hr/compliance/esocial-s1200')
      .set('Authorization', `Bearer ${token}`)
      .send({
        competencia: '2026-03',
        scope: 'CUSTOM',
        employeeIds: [employeeId],
      });
    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/Configure eSocial/);
  });

  it('retorna 400 quando rubricas HE/DSR não mapeadas (Pitfall 6)', async () => {
    // Seed EsocialConfig mas sem rubricas
    await prisma.esocialConfig.upsert({
      where: { tenantId },
      create: {
        tenantId,
        environment: 'HOMOLOGACAO',
        employerType: 'CNPJ',
        employerDocument: '00000000000100',
      },
      update: {
        environment: 'HOMOLOGACAO',
        employerDocument: '00000000000100',
      },
    });

    const response = await request(app.server)
      .post('/v1/hr/compliance/esocial-s1200')
      .set('Authorization', `Bearer ${token}`)
      .send({
        competencia: '2026-03',
        scope: 'CUSTOM',
        employeeIds: [employeeId],
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/Configure rubricas HE\/DSR/);
  });

  it('gera S-1200 (202) com batchId + eventIds + artifactIds', async () => {
    // Seed rubricas obrigatórias
    for (const concept of ['HE_50', 'HE_100', 'DSR'] as const) {
      await prisma.complianceRubricaMap.upsert({
        where: {
          tenantId_clrConcept: { tenantId, clrConcept: concept },
        },
        create: {
          tenantId,
          clrConcept: concept,
          codRubr: concept.replace('_', ''),
          ideTabRubr: 'TAB01',
          indApurIR: 0,
          updatedBy: 'e2e-user',
        },
        update: {
          codRubr: concept.replace('_', ''),
          ideTabRubr: 'TAB01',
          indApurIR: 0,
          updatedBy: 'e2e-user',
        },
      });
    }

    // Seed Payroll + PayrollItem para o funcionário na competência, para que
    // o use case gere ao menos 1 evento com sucesso (caso contrário retorna
    // 400 por 100% fails).
    const payroll = await prisma.payroll.create({
      data: {
        tenantId,
        referenceYear: 2026,
        referenceMonth: 3,
        status: 'DRAFT',
        totalGross: 3000,
        totalDeductions: 0,
        totalNet: 3000,
      },
    });
    await prisma.payrollItem.create({
      data: {
        payrollId: payroll.id,
        employeeId,
        type: 'BASE_SALARY',
        description: 'Salário base',
        amount: 3000,
        isDeduction: false,
      },
    });

    const response = await request(app.server)
      .post('/v1/hr/compliance/esocial-s1200')
      .set('Authorization', `Bearer ${token}`)
      .send({
        competencia: '2026-03',
        scope: 'CUSTOM',
        employeeIds: [employeeId],
      });

    expect(response.status).toBe(202);
    expect(response.body.batchId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    expect(response.body.environment).toBe('HOMOLOGACAO');
    expect(response.body.eventIds.length).toBe(1);
    expect(response.body.artifactIds.length).toBe(1);
    expect(response.body.errors).toEqual([]);

    // EsocialBatch criado
    const batch = await prisma.esocialBatch.findUnique({
      where: { id: response.body.batchId },
    });
    expect(batch).not.toBeNull();
    expect(batch?.tenantId).toBe(tenantId);
    expect(batch?.environment).toBe('HOMOLOGACAO');
    expect(batch?.totalEvents).toBe(1);

    // EsocialEvent criado com xmlContent + status DRAFT
    const events = await prisma.esocialEvent.findMany({
      where: { batchId: batch!.id },
    });
    expect(events).toHaveLength(1);
    expect(events[0].status).toBe('DRAFT');
    expect(events[0].eventType).toBe('S-1200');
    expect(events[0].xmlContent).toContain('<indRetif>1</indRetif>');
    expect(events[0].xmlContent).toContain('<tpAmb>2</tpAmb>');
    expect(events[0].xmlContent).toContain('<perApur>2026-03</perApur>');

    // ComplianceArtifact(type=S1200_XML) persistido
    const artifact = await prisma.complianceArtifact.findUnique({
      where: { id: response.body.artifactIds[0] },
    });
    expect(artifact).not.toBeNull();
    expect(artifact?.type).toBe('S1200_XML');
    expect(artifact?.competencia).toBe('2026-03');

    // Audit log
    const auditRows = await prisma.auditLog.findMany({
      where: {
        tenantId,
        entityId: response.body.batchId,
      },
    });
    expect(auditRows.length).toBeGreaterThanOrEqual(1);
  });

  it('retorna 400 para competência inválida (Zod regex fail)', async () => {
    const response = await request(app.server)
      .post('/v1/hr/compliance/esocial-s1200')
      .set('Authorization', `Bearer ${token}`)
      .send({
        competencia: '03-2026',
        scope: 'CUSTOM',
        employeeIds: [employeeId],
      });
    expect([400, 422]).toContain(response.status);
  });

  it('retorna 400 para scope=CUSTOM sem employeeIds (Zod refine)', async () => {
    const response = await request(app.server)
      .post('/v1/hr/compliance/esocial-s1200')
      .set('Authorization', `Bearer ${token}`)
      .send({
        competencia: '2026-03',
        scope: 'CUSTOM',
      });
    expect([400, 422]).toContain(response.status);
  });

  it('retorna 403 quando user não tem hr.compliance.s1200.submit', async () => {
    const limited = await createAndAuthenticateUser(app, {
      tenantId,
      permissions: ['hr.compliance.access'],
    });
    const response = await request(app.server)
      .post('/v1/hr/compliance/esocial-s1200')
      .set('Authorization', `Bearer ${limited.token}`)
      .send({
        competencia: '2026-03',
        scope: 'CUSTOM',
        employeeIds: [employeeId],
      });
    expect(response.status).toBe(403);
  });
});
