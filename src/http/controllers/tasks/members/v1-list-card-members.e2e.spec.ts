import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createTaskBoard } from '@/utils/tests/factories/tasks/create-task-board-test-data.e2e';
import { createTaskCard } from '@/utils/tests/factories/tasks/create-task-card-test-data.e2e';

describe('List Card Members (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should list members of a card', async () => {
    const { token, user } = await createAndAuthenticateUser(app, { tenantId });
    const userId = user.user.id;

    const { user: memberUser } = await createAndAuthenticateUser(app, {
      tenantId,
    });
    const memberId = memberUser.user.id;

    const { board, columns } = await createTaskBoard(tenantId, userId);
    const card = await createTaskCard(board.id, columns[0].id, userId);

    // Add a member first
    await request(app.server)
      .post(`/v1/tasks/boards/${board.id}/cards/${card.id}/members`)
      .set('Authorization', `Bearer ${token}`)
      .send({ userId: memberId });

    const response = await request(app.server)
      .get(`/v1/tasks/boards/${board.id}/cards/${card.id}/members`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('members');
    expect(Array.isArray(response.body.members)).toBe(true);
    expect(response.body.members.length).toBeGreaterThanOrEqual(1);
  });

  it('should return 404 when card does not exist', async () => {
    const { token, user } = await createAndAuthenticateUser(app, { tenantId });
    const userId = user.user.id;

    const { board } = await createTaskBoard(tenantId, userId);

    const response = await request(app.server)
      .get(
        `/v1/tasks/boards/${board.id}/cards/00000000-0000-0000-0000-000000000000/members`,
      )
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server).get(
      '/v1/tasks/boards/00000000-0000-0000-0000-000000000000/cards/00000000-0000-0000-0000-000000000000/members',
    );

    expect(response.status).toBe(401);
  });
});
