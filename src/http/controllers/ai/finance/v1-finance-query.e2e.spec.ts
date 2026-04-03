import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Finance Query (E2E)', () => {
  let tenantId: string;
  let token: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;
  });


  it('should query finances using natural language (200)', async () => {
    const response = await request(app.server)
      .post('/v1/ai/finance-query')
      .set('Authorization', `Bearer ${token}`)
      .send({
        query: 'Qual o total de contas a pagar este mes?',
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('answer');
    expect(response.body).toHaveProperty('data');
    expect(typeof response.body.answer).toBe('string');
  });

  it('should validate query min length', async () => {
    const response = await request(app.server)
      .post('/v1/ai/finance-query')
      .set('Authorization', `Bearer ${token}`)
      .send({
        query: 'a',
      });

    expect(response.status).toBe(400);
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server)
      .post('/v1/ai/finance-query')
      .send({
        query: 'Qual o total de contas a pagar?',
      });

    expect(response.status).toBe(401);
  });
});
