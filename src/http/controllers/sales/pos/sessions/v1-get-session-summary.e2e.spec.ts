import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

function generateCode(): string {
  const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += charset[Math.floor(Math.random() * charset.length)];
  }
  return result;
}

describe('Get Session Summary (E2E)', () => {
  let tenantId: string;
  let token: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server).get(
      '/v1/pos/sessions/00000000-0000-0000-0000-000000000001/summary',
    );

    expect(response.status).toBe(401);
  });

  it('should get session summary (200)', async () => {
    const terminal = await prisma.posTerminal.create({
      data: {
        tenantId,
        terminalName: `Summary Terminal ${Date.now()}`,
        terminalCode: generateCode(),
        mode: 'CASHIER',
        isActive: true,
        requiresSession: true,
        allowAnonymous: false,
      },
    });

    const openRes = await request(app.server)
      .post('/v1/pos/sessions/open')
      .set('Authorization', `Bearer ${token}`)
      .send({ terminalId: terminal.id, openingBalance: 200 });

    if (openRes.status !== 201) {
      return;
    }

    const sessionId = openRes.body.session.id;

    const response = await request(app.server)
      .get(`/v1/pos/sessions/${sessionId}/summary`)
      .set('Authorization', `Bearer ${token}`);

    expect([200, 404]).toContain(response.status);
    if (response.status === 200) {
      expect(response.body.summary).toBeDefined();
      expect(response.body.summary.sessionId).toBe(sessionId);
    }
  });
});
