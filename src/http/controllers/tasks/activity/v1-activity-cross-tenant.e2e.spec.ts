import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createTaskBoard } from '@/utils/tests/factories/tasks/create-task-board-test-data.e2e';
import { createTaskCard } from '@/utils/tests/factories/tasks/create-task-card-test-data.e2e';

describe('Activity Cross-Tenant Isolation (E2E)', () => {
  let tenantIdA: string;
  let tenantIdB: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tidA } = await createAndSetupTenant({
      name: 'Tenant A',
    });
    const { tenantId: tidB } = await createAndSetupTenant({
      name: 'Tenant B',
    });
    tenantIdA = tidA;
    tenantIdB = tidB;
  });

  it('should not allow user from tenant B to access board activity from tenant A', async () => {
    // Create user and board in tenant A
    const { user: userA } = await createAndAuthenticateUser(app, {
      tenantId: tenantIdA,
    });
    const userIdA = userA.user.id;

    const { board, columns } = await createTaskBoard(tenantIdA, userIdA);
    const card = await createTaskCard(board.id, columns[0].id, userIdA);

    // Create activity in tenant A's board
    await prisma.cardActivity.create({
      data: {
        cardId: card.id,
        boardId: board.id,
        userId: userIdA,
        type: 'CREATED',
        description: 'Cartão criado no tenant A',
      },
    });

    // Create user in tenant B
    const { token: tokenB } = await createAndAuthenticateUser(app, {
      tenantId: tenantIdB,
    });

    // Tenant B user tries to access tenant A's board activity
    const response = await request(app.server)
      .get(`/v1/tasks/boards/${board.id}/activity`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('message');
  });

  it('should not allow user from tenant B to access card activity from tenant A', async () => {
    // Create user and board in tenant A
    const { user: userA } = await createAndAuthenticateUser(app, {
      tenantId: tenantIdA,
    });
    const userIdA = userA.user.id;

    const { board, columns } = await createTaskBoard(tenantIdA, userIdA);
    const card = await createTaskCard(board.id, columns[0].id, userIdA);

    // Create activity in tenant A's board
    await prisma.cardActivity.create({
      data: {
        cardId: card.id,
        boardId: board.id,
        userId: userIdA,
        type: 'CREATED',
        description: 'Cartão criado no tenant A',
      },
    });

    // Create user in tenant B
    const { token: tokenB } = await createAndAuthenticateUser(app, {
      tenantId: tenantIdB,
    });

    // Tenant B user tries to access tenant A's card activity
    const response = await request(app.server)
      .get(`/v1/tasks/boards/${board.id}/cards/${card.id}/activity`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('message');
  });
});
