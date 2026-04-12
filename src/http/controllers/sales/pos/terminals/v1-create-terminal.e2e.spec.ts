import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Create POS Terminal (E2E)', () => {
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
      .post('/v1/pos/terminals')
      .send({ terminalName: 'Terminal 1', mode: 'SALES_ONLY' });

    expect(response.status).toBe(401);
  });

  it('should create a terminal with mode SALES_ONLY (201)', async () => {
    const response = await request(app.server)
      .post('/v1/pos/terminals')
      .set('Authorization', `Bearer ${token}`)
      .send({ terminalName: 'Terminal Vendas', mode: 'SALES_ONLY' });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('terminal');
    expect(response.body.terminal.terminalName).toBe('Terminal Vendas');
    expect(response.body.terminal.mode).toBe('SALES_ONLY');
    expect(response.body.terminal).toHaveProperty('terminalCode');
    expect(response.body.terminal.terminalCode).toHaveLength(8);
  });

  it('should create a terminal with mode TOTEM and generate totemCode (201)', async () => {
    const response = await request(app.server)
      .post('/v1/pos/terminals')
      .set('Authorization', `Bearer ${token}`)
      .send({ terminalName: 'Totem Autoatendimento', mode: 'TOTEM' });

    expect(response.status).toBe(201);
    expect(response.body.terminal.mode).toBe('TOTEM');
    expect(response.body.terminal.totemCode).not.toBeNull();
    expect(typeof response.body.terminal.totemCode).toBe('string');
  });

  it('should return 400 with invalid body (missing terminalName)', async () => {
    const response = await request(app.server)
      .post('/v1/pos/terminals')
      .set('Authorization', `Bearer ${token}`)
      .send({ mode: 'SALES_ONLY' });

    expect(response.status).toBe(400);
  });
});
