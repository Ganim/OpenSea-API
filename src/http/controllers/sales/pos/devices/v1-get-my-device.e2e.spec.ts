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

async function createTerminalInDb(
  tenantId: string,
): Promise<{ id: string; terminalCode: string }> {
  const code = generateCode();
  const terminal = await prisma.posTerminal.create({
    data: {
      tenantId,
      terminalName: 'Terminal Get Device',
      terminalCode: code,
      mode: 'SALES_ONLY',
      isActive: true,
      requiresSession: false,
      allowAnonymous: false,
    },
  });
  return { id: terminal.id, terminalCode: code };
}

describe('Get My Device (E2E)', () => {
  let tenantId: string;
  let token: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;
  });

  it('should return 401 without X-Pos-Device-Token header', async () => {
    const response = await request(app.server).get('/v1/pos/devices/me');

    expect(response.status).toBe(401);
  });

  it('should return 401 with invalid device token', async () => {
    const response = await request(app.server)
      .get('/v1/pos/devices/me')
      .set('X-Pos-Device-Token', 'invalid-token-that-does-not-exist');

    expect(response.status).toBe(401);
  });

  it('should return terminal and currentSession:null with valid device token (200)', async () => {
    const { id: terminalId, terminalCode } = await createTerminalInDb(tenantId);

    // Open pairing window
    await request(app.server)
      .post(`/v1/pos/terminals/${terminalId}/pairing-window`)
      .set('Authorization', `Bearer ${token}`);

    // Pair device and get token
    const pairRes = await request(app.server)
      .post('/v1/pos/devices/pair')
      .set('Authorization', `Bearer ${token}`)
      .send({ terminalCode, deviceLabel: 'Tablet Get Device Test' });

    expect(pairRes.status).toBe(201);
    const deviceToken = pairRes.body.deviceToken as string;

    // Get device info
    const response = await request(app.server)
      .get('/v1/pos/devices/me')
      .set('X-Pos-Device-Token', deviceToken);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('terminal');
    expect(response.body.terminal.id).toBe(terminalId);
    expect(response.body).toHaveProperty('currentSession');
    expect(response.body.currentSession).toBeNull();
  });
});
