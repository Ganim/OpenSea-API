import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createTaskBoard } from '@/utils/tests/factories/tasks/create-task-board-test-data.e2e';
import { createTaskCard } from '@/utils/tests/factories/tasks/create-task-card-test-data.e2e';

describe('List Card Watchers (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should list watchers of a card', async () => {
    const { token, user } = await createAndAuthenticateUser(app, { tenantId });
    const userId = user.user.id;

    const { board, columns } = await createTaskBoard(tenantId, userId);
    const card = await createTaskCard(board.id, columns[0].id, userId);

    // Watch the card first
    await request(app.server)
      .post(`/v1/tasks/boards/${board.id}/cards/${card.id}/watch`)
      .set('Authorization', `Bearer ${token}`);

    const response = await request(app.server)
      .get(`/v1/tasks/boards/${board.id}/cards/${card.id}/watchers`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('watchers');
    expect(Array.isArray(response.body.watchers)).toBe(true);
    expect(response.body.watchers.length).toBe(1);
    expect(response.body.watchers[0].cardId).toBe(card.id);
    expect(response.body.watchers[0].userId).toBe(userId);
    expect(response.body.watchers[0].boardId).toBe(board.id);
  });

  it('should return empty array if no watchers', async () => {
    const { token, user } = await createAndAuthenticateUser(app, { tenantId });
    const userId = user.user.id;

    const { board, columns } = await createTaskBoard(tenantId, userId);
    const card = await createTaskCard(board.id, columns[0].id, userId);

    const response = await request(app.server)
      .get(`/v1/tasks/boards/${board.id}/cards/${card.id}/watchers`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('watchers');
    expect(Array.isArray(response.body.watchers)).toBe(true);
    expect(response.body.watchers.length).toBe(0);
  });

  it('should return 404 if board does not exist', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const fakeBoardId = randomUUID();
    const fakeCardId = randomUUID();

    const response = await request(app.server)
      .get(`/v1/tasks/boards/${fakeBoardId}/cards/${fakeCardId}/watchers`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('message');
  });

  it('should list multiple watchers', async () => {
    const { token: token1, user: user1 } = await createAndAuthenticateUser(
      app,
      { tenantId },
    );
    const userId1 = user1.user.id;

    const { board, columns } = await createTaskBoard(tenantId, userId1);
    const card = await createTaskCard(board.id, columns[0].id, userId1);

    // First user watches the card
    await request(app.server)
      .post(`/v1/tasks/boards/${board.id}/cards/${card.id}/watch`)
      .set('Authorization', `Bearer ${token1}`);

    // Second user watches the card
    const { token: token2 } = await createAndAuthenticateUser(app, {
      tenantId,
    });
    await request(app.server)
      .post(`/v1/tasks/boards/${board.id}/cards/${card.id}/watch`)
      .set('Authorization', `Bearer ${token2}`);

    const response = await request(app.server)
      .get(`/v1/tasks/boards/${board.id}/cards/${card.id}/watchers`)
      .set('Authorization', `Bearer ${token1}`);

    expect(response.status).toBe(200);
    expect(response.body.watchers.length).toBe(2);
  });

  it('should return 401 without authentication', async () => {
    const { user } = await createAndAuthenticateUser(app, { tenantId });
    const userId = user.user.id;

    const { board, columns } = await createTaskBoard(tenantId, userId);
    const card = await createTaskCard(board.id, columns[0].id, userId);

    const response = await request(app.server).get(
      `/v1/tasks/boards/${board.id}/cards/${card.id}/watchers`,
    );

    expect(response.status).toBe(401);
  });
});
