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
      terminalName: 'Terminal Listar Sessões',
      terminalCode: generateCode(),
      mode: 'CASHIER',
      isActive: true,
      requiresSession: true,
      allowAnonymous: false,
    },
  });
  return { id: terminal.id };
}

describe('List POS Sessions (E2E)', () => {
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
    const response = await request(app.server).get('/v1/pos/sessions');
    expect(response.status).toBe(401);
  });

  it('should return 200 with empty list when no sessions exist', async () => {
    const response = await request(app.server)
      .get('/v1/pos/sessions')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('meta');
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it('should return 200 with sessions after opening one', async () => {
    const { id: terminalId } = await createTerminalInDb(tenantId);

    await request(app.server)
      .post('/v1/pos/sessions/open')
      .set('Authorization', `Bearer ${token}`)
      .send({ terminalId, openingBalance: 75 });

    const response = await request(app.server)
      .get('/v1/pos/sessions')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBeGreaterThan(0);
    expect(response.body.meta).toHaveProperty('total');
    expect(response.body.meta).toHaveProperty('page');
    expect(response.body.meta).toHaveProperty('limit');
    expect(response.body.meta).toHaveProperty('pages');
  });
});
