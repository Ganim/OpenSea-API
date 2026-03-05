import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Create Board (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create a board', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post('/v1/tasks/boards')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Meu Quadro',
        type: 'PERSONAL',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('board');
    expect(response.body.board).toHaveProperty('id');
    expect(response.body.board.title).toBe('Meu Quadro');
    expect(response.body.board.type).toBe('PERSONAL');
  });
});
