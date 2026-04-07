import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

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

  it('should create a board with description, gradientId and default columns', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post('/v1/tasks/boards')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Quadro Completo',
        description: 'Descrição do quadro de testes',
        type: 'PERSONAL',
        visibility: 'SHARED',
        gradientId: 'purple-pink',
      });

    expect(response.status).toBe(201);
    expect(response.body.board.title).toBe('Quadro Completo');
    expect(response.body.board.description).toBe(
      'Descrição do quadro de testes',
    );
    expect(response.body.board.visibility).toBe('SHARED');
    expect(response.body.board.gradientId).toBe('purple-pink');
    expect(response.body.board.columns).toBeDefined();
    expect(response.body.board.columns.length).toBeGreaterThanOrEqual(3);
  });

  it('should return 400 when title is missing', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post('/v1/tasks/boards')
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'PERSONAL' });

    expect(response.status).toBe(400);
  });

  it('should return 401 without authentication', async () => {
    const response = await request(app.server)
      .post('/v1/tasks/boards')
      .send({ title: 'Quadro Sem Auth', type: 'PERSONAL' });

    expect(response.status).toBe(401);
  });
});
