import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createTaskBoard } from '@/utils/tests/factories/tasks/create-task-board-test-data.e2e';
import { createTaskCard } from '@/utils/tests/factories/tasks/create-task-card-test-data.e2e';

describe('Toggle Checklist Item (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  it('should toggle a checklist item completion', async () => {
    const { token, user } = await createAndAuthenticateUser(app, { tenantId });
    const userId = user.user.id;

    const { board, columns } = await createTaskBoard(tenantId, userId);
    const card = await createTaskCard(board.id, columns[0].id, userId);

    const checklist = await prisma.cardChecklist.create({
      data: { cardId: card.id, title: 'Checklist' },
    });

    const item = await prisma.checklistItem.create({
      data: {
        checklistId: checklist.id,
        title: 'Item para marcar',
        isCompleted: false,
      },
    });

    const response = await request(app.server)
      .patch(
        `/v1/tasks/boards/${board.id}/cards/${card.id}/checklists/${checklist.id}/items/${item.id}/toggle`,
      )
      .set('Authorization', `Bearer ${token}`)
      .send({ isCompleted: true });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('item');
    expect(response.body.item.isCompleted).toBe(true);
  });
});
