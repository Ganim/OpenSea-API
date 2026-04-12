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
  overrides?: Partial<{ terminalName: string; mode: string }>,
): Promise<{ id: string; terminalCode: string }> {
  const code = generateCode();
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

describe('Update POS Terminal (E2E)', () => {
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
      .patch('/v1/pos/terminals/00000000-0000-0000-0000-000000000000')
      .send({ terminalName: 'Updated Terminal' });

    expect(response.status).toBe(401);
  });

  it('should update terminalName (200)', async () => {
    const { id: terminalId } = await createTerminalInDb(tenantId, {
      terminalName: 'Terminal Original',
    });

    const response = await request(app.server)
      .patch(`/v1/pos/terminals/${terminalId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ terminalName: 'Terminal Atualizado' });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('terminal');
    expect(response.body.terminal.terminalName).toBe('Terminal Atualizado');
    expect(response.body.terminal.id).toBe(terminalId);
  });

  it('should return 404 when terminal does not exist', async () => {
    const response = await request(app.server)
      .patch('/v1/pos/terminals/00000000-0000-0000-0000-000000000001')
      .set('Authorization', `Bearer ${token}`)
      .send({ terminalName: 'Qualquer Nome' });

    expect(response.status).toBe(404);
  });
});
