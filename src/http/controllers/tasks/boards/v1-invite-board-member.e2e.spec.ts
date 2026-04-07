import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createTaskBoard } from '@/utils/tests/factories/tasks/create-task-board-test-data.e2e';

describe('Invite Board Member (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should invite a member to a board', async () => {
    const { token, user } = await createAndAuthenticateUser(app, { tenantId });
    const userId = user.user.id;

    const { user: otherUser } = await createAndAuthenticateUser(app, {
      tenantId,
    });
    const otherUserId = otherUser.user.id;

    const { board } = await createTaskBoard(tenantId, userId);

    const response = await request(app.server)
      .post(`/v1/tasks/boards/${board.id}/members`)
      .set('Authorization', `Bearer ${token}`)
      .send({ userId: otherUserId, role: 'VIEWER' });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('member');
    expect(response.body.member).toHaveProperty('id');
    expect(response.body.member.userId).toBe(otherUserId);
    expect(response.body.member.role).toBe('VIEWER');
  });
});
