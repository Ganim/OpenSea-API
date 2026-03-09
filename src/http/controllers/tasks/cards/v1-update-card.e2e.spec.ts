import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createTaskBoard } from '@/utils/tests/factories/tasks/create-task-board-test-data.e2e';
import { createTaskCard } from '@/utils/tests/factories/tasks/create-task-card-test-data.e2e';

describe('Update Card (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should update a card title', async () => {
    const { token, user } = await createAndAuthenticateUser(app, { tenantId });
    const userId = user.user.id;

    const { board, columns } = await createTaskBoard(tenantId, userId);
    const card = await createTaskCard(board.id, columns[0].id, userId);

    const response = await request(app.server)
      .patch(`/v1/tasks/boards/${board.id}/cards/${card.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Tarefa Atualizada' });

    expect(response.status).toBe(200);
    expect(response.body.card.title).toBe('Tarefa Atualizada');
  });

  it('should update multiple card fields at once', async () => {
    const { token, user } = await createAndAuthenticateUser(app, { tenantId });
    const userId = user.user.id;

    const { board, columns } = await createTaskBoard(tenantId, userId);
    const card = await createTaskCard(board.id, columns[0].id, userId);

    const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const response = await request(app.server)
      .patch(`/v1/tasks/boards/${board.id}/cards/${card.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Tarefa Completa',
        description: 'Descrição detalhada da tarefa',
        priority: 'URGENT',
        dueDate,
      });

    expect(response.status).toBe(200);
    expect(response.body.card.title).toBe('Tarefa Completa');
    expect(response.body.card.description).toBe('Descrição detalhada da tarefa');
    expect(response.body.card.priority).toBe('URGENT');
    expect(response.body.card.dueDate).toBeTruthy();
  });
});
