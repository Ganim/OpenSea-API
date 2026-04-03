import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createTaskBoard } from '@/utils/tests/factories/tasks/create-task-board-test-data.e2e';

describe('Create Automation (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  it('should create a board automation', async () => {
    const { token, user } = await createAndAuthenticateUser(app, { tenantId });
    const userId = user.user.id;

    const { board } = await createTaskBoard(tenantId, userId);

    const response = await request(app.server)
      .post(`/v1/tasks/boards/${board.id}/automations`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Auto-completar',
        trigger: 'ALL_SUBTASKS_DONE',
        triggerConfig: {},
        action: 'COMPLETE_CARD',
        actionConfig: {},
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('automation');
    expect(response.body.automation.name).toBe('Auto-completar');
    expect(response.body.automation.trigger).toBe('ALL_SUBTASKS_DONE');
    expect(response.body.automation.action).toBe('COMPLETE_CARD');
    expect(response.body.automation.isActive).toBe(true);
  });
});
