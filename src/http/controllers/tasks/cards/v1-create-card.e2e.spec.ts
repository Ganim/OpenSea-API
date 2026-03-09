import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createTaskBoard } from '@/utils/tests/factories/tasks/create-task-board-test-data.e2e';

describe('Create Card (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create a card', async () => {
    const { token, user } = await createAndAuthenticateUser(app, { tenantId });
    const userId = user.user.id;

    const { board } = await createTaskBoard(tenantId, userId);

    const response = await request(app.server)
      .post(`/v1/tasks/boards/${board.id}/cards`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Minha Tarefa', priority: 'HIGH' });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('card');
    expect(response.body.card).toHaveProperty('id');
    expect(response.body.card.title).toBe('Minha Tarefa');
    expect(response.body.card.priority).toBe('HIGH');
    expect(response.body.card.boardId).toBe(board.id);
  });

  it('should create a card in a specific column with description', async () => {
    const { token, user } = await createAndAuthenticateUser(app, { tenantId });
    const userId = user.user.id;

    const { board, columns } = await createTaskBoard(tenantId, userId);
    const targetColumn = columns[1]; // second column

    const response = await request(app.server)
      .post(`/v1/tasks/boards/${board.id}/cards`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Tarefa na Coluna 2',
        description: 'Descrição da tarefa',
        columnId: targetColumn.id,
        priority: 'LOW',
      });

    expect(response.status).toBe(201);
    expect(response.body.card.title).toBe('Tarefa na Coluna 2');
    expect(response.body.card.columnId).toBe(targetColumn.id);
    expect(response.body.card.description).toBe('Descrição da tarefa');
    expect(response.body.card.priority).toBe('LOW');
  });

  it('should return 400 when title is missing', async () => {
    const { token, user } = await createAndAuthenticateUser(app, { tenantId });
    const userId = user.user.id;

    const { board } = await createTaskBoard(tenantId, userId);

    const response = await request(app.server)
      .post(`/v1/tasks/boards/${board.id}/cards`)
      .set('Authorization', `Bearer ${token}`)
      .send({ priority: 'HIGH' });

    expect(response.status).toBe(400);
  });

  it('should return 404 when board does not exist', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post('/v1/tasks/boards/00000000-0000-0000-0000-000000000000/cards')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Tarefa Órfã', priority: 'HIGH' });

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('message');
  });
});
