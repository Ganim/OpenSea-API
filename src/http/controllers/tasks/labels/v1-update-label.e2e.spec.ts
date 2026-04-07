import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createTaskBoard } from '@/utils/tests/factories/tasks/create-task-board-test-data.e2e';

describe('Update Label (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should update a label', async () => {
    const { token, user } = await createAndAuthenticateUser(app, { tenantId });
    const userId = user.user.id;

    const { board } = await createTaskBoard(tenantId, userId);

    const label = await prisma.boardLabel.create({
      data: { boardId: board.id, name: 'Bug', color: '#ef4444' },
    });

    const response = await request(app.server)
      .patch(`/v1/tasks/boards/${board.id}/labels/${label.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Correção', color: '#22c55e' });

    expect(response.status).toBe(200);
    expect(response.body.label.name).toBe('Correção');
    expect(response.body.label.color).toBe('#22c55e');
  });
});
