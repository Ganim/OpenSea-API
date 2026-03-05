import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createTaskBoard } from '@/utils/tests/factories/tasks/create-task-board-test-data.e2e';

describe('List Automations (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should list board automations', async () => {
    const { token, user } = await createAndAuthenticateUser(app, { tenantId });
    const userId = user.user.id;

    const { board } = await createTaskBoard(tenantId, userId);

    await prisma.boardAutomation.create({
      data: {
        boardId: board.id,
        name: 'Automação de Teste',
        trigger: 'CARD_MOVED',
        triggerConfig: {},
        action: 'SEND_NOTIFICATION',
        actionConfig: {},
        createdBy: userId,
      },
    });

    const response = await request(app.server)
      .get(`/v1/tasks/boards/${board.id}/automations`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('automations');
    expect(Array.isArray(response.body.automations)).toBe(true);
    expect(response.body.automations.length).toBeGreaterThanOrEqual(1);
  });
});
