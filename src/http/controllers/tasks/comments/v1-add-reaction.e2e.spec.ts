import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createTaskBoard } from '@/utils/tests/factories/tasks/create-task-board-test-data.e2e';
import { createTaskCard } from '@/utils/tests/factories/tasks/create-task-card-test-data.e2e';

describe('Add Reaction (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should add a reaction to a comment', async () => {
    const { token, user } = await createAndAuthenticateUser(app, { tenantId });
    const userId = user.user.id;

    const { board, columns } = await createTaskBoard(tenantId, userId);
    const card = await createTaskCard(board.id, columns[0].id, userId);

    const comment = await prisma.cardComment.create({
      data: {
        cardId: card.id,
        authorId: userId,
        content: 'Comentário com reação',
      },
    });

    const response = await request(app.server)
      .post(
        `/v1/tasks/boards/${board.id}/cards/${card.id}/comments/${comment.id}/reactions`,
      )
      .set('Authorization', `Bearer ${token}`)
      .send({ emoji: '👍' });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('comment');
  });
});
