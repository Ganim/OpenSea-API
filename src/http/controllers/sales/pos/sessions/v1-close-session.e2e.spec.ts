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
      terminalName: 'Terminal Fechar Sessão',
      terminalCode: generateCode(),
      mode: 'CASHIER',
      isActive: true,
      requiresSession: true,
      allowAnonymous: false,
    },
  });
  return { id: terminal.id };
}

describe('Close POS Session (E2E)', () => {
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
    const response = await request(app.server)
      .post('/v1/pos/sessions/00000000-0000-0000-0000-000000000000/close')
      .send({ closingBalance: 100 });

    expect(response.status).toBe(401);
  });

  it('should close an open session (200)', async () => {
    const { id: terminalId } = await createTerminalInDb(tenantId);

    const openResponse = await request(app.server)
      .post('/v1/pos/sessions/open')
      .set('Authorization', `Bearer ${token}`)
      .send({ terminalId, openingBalance: 100 });

    expect(openResponse.status).toBe(201);
    const sessionId = openResponse.body.session.id;

    const closeResponse = await request(app.server)
      .post(`/v1/pos/sessions/${sessionId}/close`)
      .set('Authorization', `Bearer ${token}`)
      .send({ closingBalance: 95 });

    expect(closeResponse.status).toBe(200);
    expect(closeResponse.body.session.status).toBe('CLOSED');
    expect(closeResponse.body.session.id).toBe(sessionId);
  });

  it('should return 404 when session does not exist', async () => {
    const response = await request(app.server)
      .post('/v1/pos/sessions/00000000-0000-0000-0000-000000000001/close')
      .set('Authorization', `Bearer ${token}`)
      .send({ closingBalance: 100 });

    expect(response.status).toBe(404);
  });
});
