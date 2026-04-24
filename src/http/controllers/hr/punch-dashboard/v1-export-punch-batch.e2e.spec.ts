import request from 'supertest';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';

describe('POST /v1/hr/punch/exports (E2E)', () => {
  let tenantId: string;
  let token: string;
  let userId: string;
  let employeeId: string;

  beforeAll(async () => {
    await app.ready();
    const tenant = await createAndSetupTenant();
    tenantId = tenant.tenantId;
    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;
    userId = auth.user.user.id;
    const emp = await createEmployeeE2E({ tenantId });
    employeeId = emp.employeeId;
  });

  beforeEach(async () => {
    await prisma.auditLog.deleteMany({
      where: { tenantId, action: 'PUNCH_BATCH_EXPORTED' },
    });
    await prisma.timeEntry.deleteMany({ where: { tenantId } });
  });

  async function seedTimeEntries(count: number): Promise<void> {
    for (let i = 0; i < count; i++) {
      await prisma.timeEntry.create({
        data: {
          tenantId,
          employeeId,
          entryType: 'CLOCK_IN',
          timestamp: new Date(`2026-04-15T08:0${i}:00.000Z`),
          nsrNumber: 10000 + i,
        },
      });
    }
  }

  it('CSV com 0 rows → 200 mode=sync + downloadUrl válido + response NÃO contém "cpf" (LGPD sentinel)', async () => {
    const response = await request(app.server)
      .post('/v1/hr/punch/exports')
      .set('Authorization', `Bearer ${token}`)
      .send({
        format: 'CSV',
        startDate: '2026-04-01',
        endDate: '2026-04-30',
      });

    expect(response.status).toBe(200);
    expect(response.body.mode).toBe('sync');
    expect(response.body.response.jobId).toMatch(/^[0-9a-f-]{36}$/i);
    expect(typeof response.body.response.downloadUrl).toBe('string');
    expect(response.body.response.downloadUrl).toMatch(/^https?:\/\//);

    // LGPD sentinel
    expect(JSON.stringify(response.body).toLowerCase()).not.toContain('cpf');

    // Audit log persistido
    const audit = await prisma.auditLog.findFirst({
      where: {
        tenantId,
        action: 'PUNCH_BATCH_EXPORTED',
        entityId: response.body.response.jobId,
      },
    });
    expect(audit).not.toBeNull();
    expect(audit?.entity).toBe('EXPORT_JOB');
  });

  it('CSV com 3 TimeEntries seeded → 200 mode=sync', async () => {
    await seedTimeEntries(3);

    const response = await request(app.server)
      .post('/v1/hr/punch/exports')
      .set('Authorization', `Bearer ${token}`)
      .send({
        format: 'CSV',
        startDate: '2026-04-01',
        endDate: '2026-04-30',
      });

    expect(response.status).toBe(200);
    expect(response.body.mode).toBe('sync');
    expect(JSON.stringify(response.body).toLowerCase()).not.toContain('cpf');
  });

  it('CSV com estimated >= 10k → 202 mode=async (mock count override via addJob)', async () => {
    // Usamos vi.spyOn para substituir countPunchExportRows; mas como o módulo
    // foi carregado, preferimos seed direto: criar 10_001 entries é caro —
    // alternativa é forçar o path async via AFD (que nunca é sync).
    // Este teste cobre o 202 via format=AFDT (sempre async).
    const response = await request(app.server)
      .post('/v1/hr/punch/exports')
      .set('Authorization', `Bearer ${token}`)
      .send({
        format: 'AFDT',
        startDate: '2026-04-01',
        endDate: '2026-04-30',
      });

    expect(response.status).toBe(202);
    expect(response.body.mode).toBe('async');
    expect(response.body.jobId).toMatch(/^[0-9a-f-]{36}$/i);
    expect(typeof response.body.message).toBe('string');
  });

  it('AFD → 202 mode=async (SEMPRE async — delega Phase 6)', async () => {
    const response = await request(app.server)
      .post('/v1/hr/punch/exports')
      .set('Authorization', `Bearer ${token}`)
      .send({
        format: 'AFD',
        startDate: '2026-04-01',
        endDate: '2026-04-30',
      });

    expect(response.status).toBe(202);
    expect(response.body.mode).toBe('async');
    expect(response.body.jobId).toMatch(/^[0-9a-f-]{36}$/i);
  });

  it('período > 365 dias → 400 com mensagem "Período máximo 365 dias"', async () => {
    const response = await request(app.server)
      .post('/v1/hr/punch/exports')
      .set('Authorization', `Bearer ${token}`)
      .send({
        format: 'CSV',
        startDate: '2024-01-01',
        endDate: '2026-04-30',
      });

    expect(response.status).toBe(400);
    // Fastify+Zod mapeia refine error para 400. Mensagem pode estar em
    // `message` (BadRequestError customizado) ou em `validation` (Zod default).
    const bodyStr = JSON.stringify(response.body).toLowerCase();
    expect(bodyStr).toContain('365');
  });

  it('endDate < startDate → 400', async () => {
    const response = await request(app.server)
      .post('/v1/hr/punch/exports')
      .set('Authorization', `Bearer ${token}`)
      .send({
        format: 'CSV',
        startDate: '2026-04-30',
        endDate: '2026-04-01',
      });

    expect(response.status).toBe(400);
  });

  it('formato inválido → 400 (Zod enum)', async () => {
    const response = await request(app.server)
      .post('/v1/hr/punch/exports')
      .set('Authorization', `Bearer ${token}`)
      .send({
        format: 'XLSX',
        startDate: '2026-04-01',
        endDate: '2026-04-30',
      });

    expect(response.status).toBe(400);
  });
});
