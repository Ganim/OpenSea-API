import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createTaskBoard } from '@/utils/tests/factories/tasks/create-task-board-test-data.e2e';
import { createTaskCard } from '@/utils/tests/factories/tasks/create-task-card-test-data.e2e';

describe('Unwatch Card (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should unwatch a card successfully', async () => {
    const { token, user } = await createAndAuthenticateUser(app, { tenantId });
    const userId = user.user.id;

    const { board, columns } = await createTaskBoard(tenantId, userId);
    const card = await createTaskCard(board.id, columns[0].id, userId);

    // Watch first
    await request(app.server)
      .post(`/v1/tasks/boards/${board.id}/cards/${card.id}/watch`)
      .set('Authorization', `Bearer ${token}`);

    // Unwatch
    const response = await request(app.server)
      .delete(`/v1/tasks/boards/${board.id}/cards/${card.id}/watch`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(204);
  });

  it('should return 404 if board does not exist', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const fakeBoardId = randomUUID();
    const fakeCardId = randomUUID();

    const response = await request(app.server)
      .delete(`/v1/tasks/boards/${fakeBoardId}/cards/${fakeCardId}/watch`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('message');
  });

  it('should return 404 if not currently watching the card', async () => {
    const { token, user } = await createAndAuthenticateUser(app, { tenantId });
    const userId = user.user.id;

    const { board, columns } = await createTaskBoard(tenantId, userId);
    const card = await createTaskCard(board.id, columns[0].id, userId);

    const response = await request(app.server)
      .delete(`/v1/tasks/boards/${board.id}/cards/${card.id}/watch`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('message');
  });

  it('should return 401 without authentication', async () => {
    const { user } = await createAndAuthenticateUser(app, { tenantId });
    const userId = user.user.id;

    const { board, columns } = await createTaskBoard(tenantId, userId);
    const card = await createTaskCard(board.id, columns[0].id, userId);

    const response = await request(app.server).delete(
      `/v1/tasks/boards/${board.id}/cards/${card.id}/watch`,
    );

    expect(response.status).toBe(401);
  });
});
