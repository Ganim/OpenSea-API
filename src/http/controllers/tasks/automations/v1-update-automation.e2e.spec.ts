import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createTaskBoard } from '@/utils/tests/factories/tasks/create-task-board-test-data.e2e';

describe('Update Automation (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should update a board automation', async () => {
    const { token, user } = await createAndAuthenticateUser(app, { tenantId });
    const userId = user.user.id;

    const { board } = await createTaskBoard(tenantId, userId);

    const automation = await prisma.boardAutomation.create({
      data: {
        boardId: board.id,
        name: 'Automação Original',
        trigger: 'CARD_MOVED',
        triggerConfig: {},
        action: 'SET_FIELD',
        actionConfig: {},
        createdBy: userId,
      },
    });

    const response = await request(app.server)
      .patch(`/v1/tasks/boards/${board.id}/automations/${automation.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Automação Atualizada' });

    expect(response.status).toBe(200);
    expect(response.body.automation.name).toBe('Automação Atualizada');
  });
});
