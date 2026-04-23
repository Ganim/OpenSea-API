import { randomUUID } from 'node:crypto';

import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { computeReceiptNsrHash } from '@/lib/compliance/nsr-hash';
import { prisma } from '@/lib/prisma';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';

/**
 * E2E — GET /v1/public/punch/verify/:nsrHash
 *
 * Valida (Phase 06 / Plan 06-03):
 *  - 200 com whitelist LGPD para hash válido
 *  - 404 quando hash não encontrado
 *  - 400 para formato inválido
 *  - Sem exigência de auth (endpoint público)
 *  - Cada acesso grava ComplianceVerifyLog (FOUND ou NOT_FOUND)
 *  - SENTINELAS LGPD: CPF, e-mail, matrícula NUNCA aparecem no response
 */
describe('Public Punch Verify (E2E)', () => {
  let tenantId: string;
  let employeeId: string;
  let timeEntryId: string;
  let nsrNumber: number;
  let validHash: string;

  const EMPLOYEE_CPF = '52998224725'; // CPF válido gerado determinísticamente
  const EMPLOYEE_EMAIL = `public-verify-${randomUUID()}@demo.com`;
  const EMPLOYEE_REG = '987654321';
  const EMPLOYEE_FULLNAME = 'JOÃO DA SILVA PUBLIC';

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;

    // Seta CNPJ no tenant.settings para o mapper mascarar corretamente.
    await prisma.tenant.update({
      where: { id: tenantId },
      data: { settings: { cnpj: '12345678000190' } },
    });

    const emp = await createEmployeeE2E({
      tenantId,
      fullName: EMPLOYEE_FULLNAME,
      cpf: EMPLOYEE_CPF,
      email: EMPLOYEE_EMAIL,
      registrationNumber: EMPLOYEE_REG,
    });
    employeeId = emp.employeeId;

    // Seed 1 TimeEntry com receiptVerifyHash pré-calculado.
    nsrNumber = 42;
    validHash = computeReceiptNsrHash(tenantId, nsrNumber);
    timeEntryId = randomUUID();

    await prisma.timeEntry.create({
      data: {
        id: timeEntryId,
        tenantId,
        employeeId,
        entryType: 'CLOCK_IN',
        timestamp: new Date('2026-03-15T11:02:00Z'),
        nsrNumber,
        adjustmentType: 'ORIGINAL',
        receiptGenerated: true,
        receiptUrl: `${tenantId}/compliance/recibo/2026/03/${validHash}.pdf`,
        receiptVerifyHash: validHash,
      },
    });
  });

  afterAll(async () => {
    await prisma.complianceVerifyLog.deleteMany({ where: { tenantId } });
    await prisma.timeEntry.deleteMany({ where: { id: timeEntryId } });
  });

  it('retorna 200 + whitelist LGPD para hash válido', async () => {
    const response = await request(app.server).get(
      `/v1/public/punch/verify/${validHash}`,
    );

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('employeeName');
    expect(response.body).toHaveProperty('tenantRazaoSocial');
    expect(response.body).toHaveProperty('tenantCnpjMasked');
    expect(response.body).toHaveProperty('nsrNumber');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('entryType');
    expect(response.body).toHaveProperty('entryTypeLabel');
    expect(response.body).toHaveProperty('status');

    expect(response.body.nsrNumber).toBe(nsrNumber);
    expect(response.body.entryType).toBe('CLOCK_IN');
    expect(response.body.entryTypeLabel).toBe('Entrada');
    expect(response.body.tenantCnpjMasked).toMatch(
      /^\*\*\.\*\*\*\.\*\*\*\/\d{4}-\d{2}$/,
    );
    expect(response.body.tenantCnpjMasked).toBe('**.***.***/0001-90');

    // ─── SENTINELAS LGPD ───────────────────────────────────────────────────
    const raw = response.text;
    expect(raw).not.toContain(EMPLOYEE_CPF); // CPF nunca no body
    expect(raw).not.toContain(EMPLOYEE_EMAIL); // email nunca no body
    expect(raw).not.toContain(EMPLOYEE_REG); // matrícula nunca no body
    expect(raw).not.toContain('"cpf"');
    expect(raw).not.toContain('"email"');
    expect(raw).not.toContain('"registrationNumber"');
    expect(raw).not.toContain('"departmentId"');
    expect(raw).not.toContain('"phone"');
    expect(raw).not.toContain('"address"');
    expect(raw).not.toContain('"latitude"');
    expect(raw).not.toContain('"longitude"');
    expect(raw).not.toContain('"photoUrl"');
    expect(raw).not.toContain('"userId"');
    expect(raw).not.toContain('"tenantId"'); // id interno não exposto
    expect(raw).not.toContain('"employeeId"');
  });

  it('retorna 404 quando hash não existe', async () => {
    const fakeHash = 'f'.repeat(64);
    const response = await request(app.server).get(
      `/v1/public/punch/verify/${fakeHash}`,
    );
    expect(response.status).toBe(404);
    expect(response.body.message).toBeDefined();
  });

  it('retorna 400 para formato inválido', async () => {
    const response = await request(app.server).get(
      '/v1/public/punch/verify/not-a-hex-hash',
    );
    expect(response.status).toBe(400);
  });

  it('NÃO exige nenhum header de autenticação', async () => {
    const response = await request(app.server)
      .get(`/v1/public/punch/verify/${validHash}`)
      .set('Authorization', '') // sem token
      .set('Cookie', '');

    expect(response.status).toBe(200);
    expect(response.status).not.toBe(401);
  });

  it('cria ComplianceVerifyLog em FOUND (tenantId resolvido)', async () => {
    // Limpa logs anteriores para contar com precisão.
    await prisma.complianceVerifyLog.deleteMany({ where: { tenantId } });

    await request(app.server).get(`/v1/public/punch/verify/${validHash}`);

    const logs = await prisma.complianceVerifyLog.findMany({
      where: { nsrHash: validHash },
    });
    expect(logs.length).toBeGreaterThanOrEqual(1);
    const found = logs.find((l) => l.hitResult === 'FOUND');
    expect(found).toBeDefined();
    expect(found?.tenantId).toBe(tenantId);
    expect(found?.timeEntryId).toBe(timeEntryId);
  });

  it('cria ComplianceVerifyLog em NOT_FOUND (tenantId null)', async () => {
    const missHash = 'a'.repeat(64);
    await prisma.complianceVerifyLog.deleteMany({
      where: { nsrHash: missHash },
    });

    await request(app.server).get(`/v1/public/punch/verify/${missHash}`);

    const logs = await prisma.complianceVerifyLog.findMany({
      where: { nsrHash: missHash, hitResult: 'NOT_FOUND' },
    });
    expect(logs.length).toBeGreaterThanOrEqual(1);
    expect(logs[0].tenantId).toBeNull();
  });
});
