import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createTaskBoard } from '@/utils/tests/factories/tasks/create-task-board-test-data.e2e';
import { createTaskCard } from '@/utils/tests/factories/tasks/create-task-card-test-data.e2e';

describe('Update Checklist (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  it('should update a checklist title', async () => {
    const { token, user } = await createAndAuthenticateUser(app, { tenantId });
    const userId = user.user.id;

    const { board, columns } = await createTaskBoard(tenantId, userId);
    const card = await createTaskCard(board.id, columns[0].id, userId);

    const checklist = await prisma.cardChecklist.create({
      data: { cardId: card.id, title: 'Título Original' },
    });

    const response = await request(app.server)
      .patch(
        `/v1/tasks/boards/${board.id}/cards/${card.id}/checklists/${checklist.id}`,
      )
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Título Atualizado' });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('checklist');
    expect(response.body.checklist.title).toBe('Título Atualizado');
  });

  it('should return 401 when not authenticated', async () => {
    const response = await request(app.server)
      .patch(
        `/v1/tasks/boards/00000000-0000-0000-0000-000000000000/cards/00000000-0000-0000-0000-000000000000/checklists/00000000-0000-0000-0000-000000000000`,
      )
      .send({ title: 'Novo Título' });

    expect(response.status).toBe(401);
  });
});
