import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createTaskBoard } from '@/utils/tests/factories/tasks/create-task-board-test-data.e2e';
import { createTaskCard } from '@/utils/tests/factories/tasks/create-task-card-test-data.e2e';

describe('Manage Card Labels (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should set labels on a card', async () => {
    const { token, user } = await createAndAuthenticateUser(app, { tenantId });
    const userId = user.user.id;

    const { board, columns } = await createTaskBoard(tenantId, userId);
    const card = await createTaskCard(board.id, columns[0].id, userId);

    // Create a label
    const label = await prisma.boardLabel.create({
      data: { boardId: board.id, name: 'Urgente', color: '#ef4444' },
    });

    const response = await request(app.server)
      .put(`/v1/tasks/boards/${board.id}/cards/${card.id}/labels`)
      .set('Authorization', `Bearer ${token}`)
      .send({ labelIds: [label.id] });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('card');
  });
});
