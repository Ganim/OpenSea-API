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

describe('Get POS Terminal (E2E)', () => {
  let tenantId: string;
  let token: string;
  let terminalId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;

    const terminal = await prisma.posTerminal.create({
      data: {
        tenantId,
        terminalName: 'Terminal Get Teste',
        terminalCode: generateCode(),
        mode: 'SALES_ONLY',
        isActive: true,
        requiresSession: false,
        allowAnonymous: false,
      },
    });
    terminalId = terminal.id;
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server).get(
      `/v1/pos/terminals/${terminalId}`,
    );
    expect(response.status).toBe(401);
  });

  it('should return 200 with the terminal when it exists', async () => {
    const response = await request(app.server)
      .get(`/v1/pos/terminals/${terminalId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('terminal');
    expect(response.body.terminal.id).toBe(terminalId);
    expect(response.body.terminal.terminalName).toBe('Terminal Get Teste');
    expect(response.body.terminal.tenantId).toBe(tenantId);
  });

  it('should return 404 when terminal does not exist', async () => {
    const response = await request(app.server)
      .get('/v1/pos/terminals/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
  });

  it('should return 404 when terminal belongs to another tenant', async () => {
    const { tenantId: otherTenantId } = await createAndSetupTenant();
    const other = await prisma.posTerminal.create({
      data: {
        tenantId: otherTenantId,
        terminalName: 'Outro Tenant',
        terminalCode: generateCode(),
        mode: 'SALES_ONLY',
        isActive: true,
        requiresSession: false,
        allowAnonymous: false,
      },
    });

    const response = await request(app.server)
      .get(`/v1/pos/terminals/${other.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
  });
});
