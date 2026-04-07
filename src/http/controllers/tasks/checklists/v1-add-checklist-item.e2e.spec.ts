import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createTaskBoard } from '@/utils/tests/factories/tasks/create-task-board-test-data.e2e';
import { createTaskCard } from '@/utils/tests/factories/tasks/create-task-card-test-data.e2e';

describe('Add Checklist Item (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should add an item to a checklist', async () => {
    const { token, user } = await createAndAuthenticateUser(app, { tenantId });
    const userId = user.user.id;

    const { board, columns } = await createTaskBoard(tenantId, userId);
    const card = await createTaskCard(board.id, columns[0].id, userId);

    const checklist = await prisma.cardChecklist.create({
      data: { cardId: card.id, title: 'Checklist de Teste' },
    });

    const response = await request(app.server)
      .post(
        `/v1/tasks/boards/${board.id}/cards/${card.id}/checklists/${checklist.id}/items`,
      )
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Item de checklist' });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('item');
    expect(response.body.item.title).toBe('Item de checklist');
    expect(response.body.item.isCompleted).toBe(false);
  });
});
