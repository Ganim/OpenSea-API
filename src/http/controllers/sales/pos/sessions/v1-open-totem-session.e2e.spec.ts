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

async function createTotemTerminalInDb(
  tenantId: string,
): Promise<{ id: string; totemCode: string }> {
  const totemCode = generateCode();
  const terminal = await prisma.posTerminal.create({
    data: {
      tenantId,
      terminalName: 'Totem Autoatendimento',
      terminalCode: generateCode(),
      totemCode,
      mode: 'TOTEM',
      isActive: true,
      requiresSession: true,
      allowAnonymous: true,
    },
  });
  return { id: terminal.id, totemCode };
}

describe('Open Totem Session (E2E)', () => {
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
      .post('/v1/pos/sessions/open-totem')
      .send({ totemCode: 'ABCD1234' });

    expect(response.status).toBe(401);
  });

  it('should open a totem session with a valid totemCode (201)', async () => {
    const { totemCode } = await createTotemTerminalInDb(tenantId);

    const response = await request(app.server)
      .post('/v1/pos/sessions/open-totem')
      .set('Authorization', `Bearer ${token}`)
      .send({ totemCode });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('session');
    expect(response.body.session.status).toBe('OPEN');
  });

  it('should return 400 with an invalid totemCode', async () => {
    const response = await request(app.server)
      .post('/v1/pos/sessions/open-totem')
      .set('Authorization', `Bearer ${token}`)
      .send({ totemCode: 'XXXXXXXX' });

    expect(response.status).toBe(400);
  });
});
