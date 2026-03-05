import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createTaskBoard } from '@/utils/tests/factories/tasks/create-task-board-test-data.e2e';
import { createTaskCard } from '@/utils/tests/factories/tasks/create-task-card-test-data.e2e';

describe('Update Comment (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should update a comment', async () => {
    const { token, user } = await createAndAuthenticateUser(app, { tenantId });
    const userId = user.user.id;

    const { board, columns } = await createTaskBoard(tenantId, userId);
    const card = await createTaskCard(board.id, columns[0].id, userId);

    const comment = await prisma.cardComment.create({
      data: {
        cardId: card.id,
        authorId: userId,
        content: 'Comentário original',
      },
    });

    const response = await request(app.server)
      .patch(
        `/v1/tasks/boards/${board.id}/cards/${card.id}/comments/${comment.id}`,
      )
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Comentário atualizado' });

    expect(response.status).toBe(200);
    expect(response.body.comment.content).toBe('Comentário atualizado');
  });
});
