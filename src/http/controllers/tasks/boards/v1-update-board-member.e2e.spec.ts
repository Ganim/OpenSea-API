import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createTaskBoard } from '@/utils/tests/factories/tasks/create-task-board-test-data.e2e';

describe('Update Board Member (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should update a board member role', async () => {
    const { token, user } = await createAndAuthenticateUser(app, { tenantId });
    const userId = user.user.id;

    const { user: otherUser } = await createAndAuthenticateUser(app, {
      tenantId,
    });
    const otherUserId = otherUser.user.id;

    const { board } = await createTaskBoard(tenantId, userId);

    // Invite member first
    await prisma.boardMember.create({
      data: { boardId: board.id, userId: otherUserId, role: 'VIEWER' },
    });

    const response = await request(app.server)
      .patch(`/v1/tasks/boards/${board.id}/members/${otherUserId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ role: 'EDITOR' });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('member');
    expect(response.body.member.role).toBe('EDITOR');
  });
});
