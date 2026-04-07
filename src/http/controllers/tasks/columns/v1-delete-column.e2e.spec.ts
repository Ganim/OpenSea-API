import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createTaskBoard } from '@/utils/tests/factories/tasks/create-task-board-test-data.e2e';

describe('Delete Column (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should delete a column', async () => {
    const { token, user } = await createAndAuthenticateUser(app, { tenantId });
    const userId = user.user.id;

    const { board } = await createTaskBoard(tenantId, userId);

    // Create an extra column to delete (not default)
    const extraColumn = await prisma.boardColumn.create({
      data: { boardId: board.id, title: 'Extra', position: 3 },
    });

    const response = await request(app.server)
      .delete(`/v1/tasks/boards/${board.id}/columns/${extraColumn.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(204);
  });
});
