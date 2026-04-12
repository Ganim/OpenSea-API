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

describe('List POS Terminals (E2E)', () => {
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
    const response = await request(app.server).get('/v1/pos/terminals');
    expect(response.status).toBe(401);
  });

  it('should return 200 with empty list when no terminals exist', async () => {
    const response = await request(app.server)
      .get('/v1/pos/terminals')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('meta');
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it('should return 200 with terminals and correct fields', async () => {
    await prisma.posTerminal.create({
      data: {
        tenantId,
        terminalName: 'Terminal Lista Teste',
        terminalCode: generateCode(),
        mode: 'SALES_ONLY',
        isActive: true,
        requiresSession: false,
        allowAnonymous: false,
      },
    });

    const response = await request(app.server)
      .get('/v1/pos/terminals')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBeGreaterThan(0);

    const terminal = response.body.data[0];
    expect(terminal).toHaveProperty('terminalName');
    expect(terminal).toHaveProperty('terminalCode');
    expect(terminal).toHaveProperty('mode');
    expect(terminal).toHaveProperty('hasPairing');
    expect(terminal).toHaveProperty('isActive');
  });
});
