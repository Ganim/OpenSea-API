import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createTaskBoard } from '@/utils/tests/factories/tasks/create-task-board-test-data.e2e';
import { createTaskCard } from '@/utils/tests/factories/tasks/create-task-card-test-data.e2e';

describe('Remove Checklist Item (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  it('should remove an item from a checklist', async () => {
    const { token, user } = await createAndAuthenticateUser(app, { tenantId });
    const userId = user.user.id;

    const { board, columns } = await createTaskBoard(tenantId, userId);
    const card = await createTaskCard(board.id, columns[0].id, userId);

    const checklist = await prisma.cardChecklist.create({
      data: { cardId: card.id, title: 'Checklist de Teste' },
    });

    const item = await prisma.checklistItem.create({
      data: {
        checklistId: checklist.id,
        title: 'Item a remover',
        position: 0,
      },
    });

    const response = await request(app.server)
      .delete(
        `/v1/tasks/boards/${board.id}/cards/${card.id}/checklists/${checklist.id}/items/${item.id}`,
      )
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(204);
  });

  it('should return 401 when not authenticated', async () => {
    const response = await request(app.server).delete(
      `/v1/tasks/boards/00000000-0000-0000-0000-000000000000/cards/00000000-0000-0000-0000-000000000000/checklists/00000000-0000-0000-0000-000000000000/items/00000000-0000-0000-0000-000000000000`,
    );

    expect(response.status).toBe(401);
  });
});
