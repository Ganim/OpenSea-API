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
  overrides?: Partial<{ mode: string }>,
): Promise<{ id: string }> {
  const mode = (overrides?.mode ?? 'CASHIER') as
    | 'SALES_ONLY'
    | 'SALES_WITH_CHECKOUT'
    | 'CASHIER'
    | 'TOTEM';
  const terminal = await prisma.posTerminal.create({
    data: {
      tenantId,
      terminalName: 'Terminal Sessão',
      terminalCode: generateCode(),
      mode,
      isActive: true,
      requiresSession: true,
      allowAnonymous: false,
    },
  });
  return { id: terminal.id };
}

describe('Open POS Session (E2E)', () => {
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
      .post('/v1/pos/sessions/open')
      .send({
        terminalId: '00000000-0000-0000-0000-000000000000',
        openingBalance: 100,
      });

    expect(response.status).toBe(401);
  });

  it('should open a session for a terminal (201)', async () => {
    const { id: terminalId } = await createTerminalInDb(tenantId);

    const response = await request(app.server)
      .post('/v1/pos/sessions/open')
      .set('Authorization', `Bearer ${token}`)
      .send({ terminalId, openingBalance: 200 });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('session');
    expect(response.body.session.status).toBe('OPEN');
    expect(response.body.session.terminalId).toBe(terminalId);
  });

  it('should return 409 ORPHAN_SESSION_EXISTS if session already open', async () => {
    const { id: terminalId } = await createTerminalInDb(tenantId);

    // Open first session
    await request(app.server)
      .post('/v1/pos/sessions/open')
      .set('Authorization', `Bearer ${token}`)
      .send({ terminalId, openingBalance: 100 });

    // Attempt to open a second session on same terminal
    const response = await request(app.server)
      .post('/v1/pos/sessions/open')
      .set('Authorization', `Bearer ${token}`)
      .send({ terminalId, openingBalance: 100 });

    expect(response.status).toBe(409);
    expect(response.body.code).toBe('ORPHAN_SESSION_EXISTS');
    expect(response.body).toHaveProperty('orphanSessionId');
  });
});
