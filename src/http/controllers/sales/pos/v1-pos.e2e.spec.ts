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
  overrides?: Partial<{
    terminalName: string;
    mode: string;
    terminalCode: string;
  }>,
): Promise<{ id: string; terminalCode: string }> {
  const code = overrides?.terminalCode ?? generateCode();
  const mode = (overrides?.mode ?? 'SALES_ONLY') as
    | 'SALES_ONLY'
    | 'SALES_WITH_CHECKOUT'
    | 'CASHIER'
    | 'TOTEM';

  const terminal = await prisma.posTerminal.create({
    data: {
      tenantId,
      terminalName: overrides?.terminalName ?? 'Terminal Teste',
      terminalCode: code,
      mode,
      isActive: true,
      requiresSession: mode !== 'SALES_ONLY',
      allowAnonymous: mode === 'TOTEM',
    },
  });
  return { id: terminal.id, terminalCode: code };
}

describe('POS (E2E)', () => {
  let tenantId: string;
  let token: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;
  });

  it('POST /v1/pos/terminals — should create a terminal (201)', async () => {
    const response = await request(app.server)
      .post('/v1/pos/terminals')
      .set('Authorization', `Bearer ${token}`)
      .send({
        terminalName: 'Terminal Caixa 01',
        mode: 'SALES_ONLY',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('terminal');
    expect(response.body.terminal).toHaveProperty('id');
    expect(response.body.terminal.terminalName).toBe('Terminal Caixa 01');
    expect(response.body.terminal).toHaveProperty('terminalCode');
  });

  it('GET /v1/pos/terminals — should list terminals (200)', async () => {
    const response = await request(app.server)
      .get('/v1/pos/terminals')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('meta');
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it('POST /v1/pos/sessions/open — should open a session (201)', async () => {
    const { id: terminalId } = await createTerminalInDb(tenantId, {
      mode: 'CASHIER',
    });

    const response = await request(app.server)
      .post('/v1/pos/sessions/open')
      .set('Authorization', `Bearer ${token}`)
      .send({
        terminalId,
        openingBalance: 100.0,
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('session');
    expect(response.body.session).toHaveProperty('id');
    expect(response.body.session.status).toBe('OPEN');
  });

  it('GET /v1/pos/sessions — should list sessions (200)', async () => {
    const response = await request(app.server)
      .get('/v1/pos/sessions')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('meta');
    expect(Array.isArray(response.body.data)).toBe(true);
  });
});
