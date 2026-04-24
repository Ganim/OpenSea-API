import jwt from 'jsonwebtoken';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { getJwtSecret, isUsingRS256, jwtConfig } from '@/config/jwt';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';

/**
 * Helper: assina um JWT de scope `action-pin` para o userId com iat agora
 * e exp 60s. Usa exatamente o mesmo secret + issuer/audience + algoritmo
 * que o app usa — respeita HS256 (simétrico) ou RS256 (RSA keys).
 */
function issueActionPinToken(userId: string): string {
  const now = Math.floor(Date.now() / 1000);
  const secret = getJwtSecret();
  const signKey = typeof secret === 'string' ? secret : secret.private;
  return jwt.sign(
    {
      scope: 'action-pin',
      sub: userId,
      iat: now,
    },
    signKey,
    {
      algorithm: isUsingRS256() ? 'RS256' : 'HS256',
      expiresIn: '60s',
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience,
    },
  );
}

describe('Batch Resolve Punch Approvals (E2E)', () => {
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

  async function seedPendingApprovals(count: number): Promise<string[]> {
    const ids: string[] = [];
    for (let i = 0; i < count; i++) {
      const te = await prisma.timeEntry.create({
        data: {
          tenantId,
          employeeId,
          entryType: 'CLOCK_IN',
          timestamp: new Date(Date.now() - i * 60000),
        },
      });
      const approval = await prisma.punchApproval.create({
        data: {
          tenantId,
          timeEntryId: te.id,
          employeeId,
          reason: 'OUT_OF_GEOFENCE',
          details: { distance: 250 + i, zoneId: 'zone-1' },
          status: 'PENDING',
        },
      });
      ids.push(approval.id);
    }
    return ids;
  }

  it('batch de 3 aprovações sem PIN → 200 (abaixo do threshold)', async () => {
    const ids = await seedPendingApprovals(3);

    const response = await request(app.server)
      .post('/v1/hr/punch-approvals/batch-resolve')
      .set('Authorization', `Bearer ${token}`)
      .send({
        approvalIds: ids,
        decision: 'APPROVE',
        note: 'lote ok',
      });

    expect(response.status).toBe(200);
    expect(response.body.totalSucceeded).toBe(3);
    expect(response.body.totalFailed).toBe(0);

    for (const id of ids) {
      const stored = await prisma.punchApproval.findUnique({ where: { id } });
      expect(stored?.status).toBe('APPROVED');
    }
  });

  it('batch de 6 aprovações SEM x-action-pin-token → 403', async () => {
    const ids = await seedPendingApprovals(6);

    const response = await request(app.server)
      .post('/v1/hr/punch-approvals/batch-resolve')
      .set('Authorization', `Bearer ${token}`)
      .send({
        approvalIds: ids,
        decision: 'APPROVE',
      });

    expect(response.status).toBe(403);

    // Nenhuma aprovação foi resolvida
    for (const id of ids) {
      const stored = await prisma.punchApproval.findUnique({ where: { id } });
      expect(stored?.status).toBe('PENDING');
    }
  });

  it('batch de 6 aprovações COM x-action-pin-token válido → 200', async () => {
    const ids = await seedPendingApprovals(6);
    const pin = issueActionPinToken(userId);

    const response = await request(app.server)
      .post('/v1/hr/punch-approvals/batch-resolve')
      .set('Authorization', `Bearer ${token}`)
      .set('x-action-pin-token', pin)
      .send({
        approvalIds: ids,
        decision: 'REJECT',
        note: 'lote > 5 com PIN',
      });

    expect(response.status).toBe(200);
    expect(response.body.totalSucceeded).toBe(6);
    expect(response.body.totalFailed).toBe(0);
  });

  it('audit log PUNCH_APPROVAL_RESOLVED é gravado após batch sucesso', async () => {
    const ids = await seedPendingApprovals(2);
    const before = await prisma.auditLog.count({
      where: { action: 'PUNCH_APPROVAL_RESOLVED' },
    });

    await request(app.server)
      .post('/v1/hr/punch-approvals/batch-resolve')
      .set('Authorization', `Bearer ${token}`)
      .send({
        approvalIds: ids,
        decision: 'APPROVE',
      });

    const after = await prisma.auditLog.count({
      where: { action: 'PUNCH_APPROVAL_RESOLVED' },
    });
    expect(after).toBeGreaterThan(before);
  });

  it('LGPD sentinel: resposta não vaza cpf', async () => {
    const ids = await seedPendingApprovals(2);
    const response = await request(app.server)
      .post('/v1/hr/punch-approvals/batch-resolve')
      .set('Authorization', `Bearer ${token}`)
      .send({
        approvalIds: ids,
        decision: 'APPROVE',
      });

    expect(response.status).toBe(200);
    expect(JSON.stringify(response.body).toLowerCase()).not.toContain('cpf');
  });
});
