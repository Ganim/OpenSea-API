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
      terminalName: 'Terminal Para Deletar',
      terminalCode: generateCode(),
      mode: 'SALES_ONLY',
      isActive: true,
      requiresSession: false,
      allowAnonymous: false,
    },
  });
  return { id: terminal.id };
}

describe('Delete POS Terminal (E2E)', () => {
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
    const response = await request(app.server).delete(
      '/v1/pos/terminals/00000000-0000-0000-0000-000000000000',
    );

    expect(response.status).toBe(401);
  });

  it('should delete an existing terminal (204)', async () => {
    const { id: terminalId } = await createTerminalInDb(tenantId);

    const response = await request(app.server)
      .delete(`/v1/pos/terminals/${terminalId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(204);
  });

  it('should return 404 when terminal does not exist', async () => {
    const response = await request(app.server)
      .delete('/v1/pos/terminals/00000000-0000-0000-0000-000000000001')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
  });
});
