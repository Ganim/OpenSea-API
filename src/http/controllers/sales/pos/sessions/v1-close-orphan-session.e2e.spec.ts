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

async function createTerminalInDb(tenantId: string): Promise<{ id: string }> {
  const terminal = await prisma.posTerminal.create({
    data: {
      tenantId,
      terminalName: 'Terminal Sessão Órfã',
      terminalCode: generateCode(),
      mode: 'CASHIER',
      isActive: true,
      requiresSession: true,
      allowAnonymous: false,
    },
  });
  return { id: terminal.id };
}

describe('Close Orphan Session (E2E)', () => {
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
    const response = await request(app.server).post(
      '/v1/pos/sessions/00000000-0000-0000-0000-000000000000/close-orphan',
    );

    expect(response.status).toBe(401);
  });

  it('should force-close an orphan session (200)', async () => {
    const { id: terminalId } = await createTerminalInDb(tenantId);

    // Open a session
    const openRes = await request(app.server)
      .post('/v1/pos/sessions/open')
      .set('Authorization', `Bearer ${token}`)
      .send({ terminalId, openingBalance: 300 });

    expect(openRes.status).toBe(201);
    const sessionId = openRes.body.session.id as string;

    // Force-close as orphan
    const response = await request(app.server)
      .post(`/v1/pos/sessions/${sessionId}/close-orphan`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('session');
    expect(response.body.session.id).toBe(sessionId);
    // Status should be CLOSED or ORPHAN_CLOSED depending on business logic
    expect(['CLOSED', 'ORPHAN_CLOSED']).toContain(response.body.session.status);
  });

  it('should return 404 when session does not exist', async () => {
    const response = await request(app.server)
      .post(
        '/v1/pos/sessions/00000000-0000-0000-0000-000000000001/close-orphan',
      )
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
  });
});
