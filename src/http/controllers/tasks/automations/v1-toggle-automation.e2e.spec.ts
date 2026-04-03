import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createTaskBoard } from '@/utils/tests/factories/tasks/create-task-board-test-data.e2e';

describe('Toggle Automation (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  it('should toggle an automation active state', async () => {
    const { token, user } = await createAndAuthenticateUser(app, { tenantId });
    const userId = user.user.id;

    const { board } = await createTaskBoard(tenantId, userId);

    const automation = await prisma.boardAutomation.create({
      data: {
        boardId: board.id,
        name: 'Automação para Toggle',
        trigger: 'CARD_MOVED',
        triggerConfig: {},
        action: 'SET_FIELD',
        actionConfig: {},
        createdBy: userId,
        isActive: true,
      },
    });

    const response = await request(app.server)
      .patch(`/v1/tasks/boards/${board.id}/automations/${automation.id}/toggle`)
      .set('Authorization', `Bearer ${token}`)
      .send({ isActive: false });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('automation');
    expect(response.body.automation.isActive).toBe(false);
  });

  it('should return 401 when not authenticated', async () => {
    const response = await request(app.server)
      .patch(
        `/v1/tasks/boards/00000000-0000-0000-0000-000000000000/automations/00000000-0000-0000-0000-000000000000/toggle`,
      )
      .send({ isActive: false });

    expect(response.status).toBe(401);
  });
});
