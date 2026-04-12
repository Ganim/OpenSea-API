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
      terminalName: 'Terminal Sessão Ativa',
      terminalCode: generateCode(),
      mode: 'CASHIER',
      isActive: true,
      requiresSession: true,
      allowAnonymous: false,
    },
  });
  return { id: terminal.id };
}

describe('Get Active POS Session (E2E)', () => {
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
      '/v1/pos/terminals/00000000-0000-0000-0000-000000000000/session',
    );

    expect(response.status).toBe(401);
  });

  it('should return null session when no session is open (200)', async () => {
    const { id: terminalId } = await createTerminalInDb(tenantId);

    const response = await request(app.server)
      .get(`/v1/pos/terminals/${terminalId}/session`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('session');
    expect(response.body.session).toBeNull();
  });

  it('should return the active session when one is open (200)', async () => {
    const { id: terminalId } = await createTerminalInDb(tenantId);

    await request(app.server)
      .post('/v1/pos/sessions/open')
      .set('Authorization', `Bearer ${token}`)
      .send({ terminalId, openingBalance: 50 });

    const response = await request(app.server)
      .get(`/v1/pos/terminals/${terminalId}/session`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.session).not.toBeNull();
    expect(response.body.session.status).toBe('OPEN');
    expect(response.body.session.terminalId).toBe(terminalId);
  });
});
