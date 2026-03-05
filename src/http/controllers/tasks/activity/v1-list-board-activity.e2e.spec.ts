import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createTaskBoard } from '@/utils/tests/factories/tasks/create-task-board-test-data.e2e';
import { createTaskCard } from '@/utils/tests/factories/tasks/create-task-card-test-data.e2e';

describe('List Board Activity (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should list activity for a board', async () => {
    const { token, user } = await createAndAuthenticateUser(app, { tenantId });
    const userId = user.user.id;

    const { board, columns } = await createTaskBoard(tenantId, userId);
    const card = await createTaskCard(board.id, columns[0].id, userId);

    // Create an activity record
    await prisma.cardActivity.create({
      data: {
        cardId: card.id,
        boardId: board.id,
        userId,
        type: 'CARD_CREATED',
        description: 'Cartão criado',
      },
    });

    const response = await request(app.server)
      .get(`/v1/tasks/boards/${board.id}/activity`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('activities');
    expect(response.body).toHaveProperty('meta');
    expect(Array.isArray(response.body.activities)).toBe(true);
    expect(response.body.activities.length).toBeGreaterThanOrEqual(1);
  });
});
