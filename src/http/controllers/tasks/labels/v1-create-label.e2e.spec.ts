import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createTaskBoard } from '@/utils/tests/factories/tasks/create-task-board-test-data.e2e';

describe('Create Label (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  it('should create a label for a board', async () => {
    const { token, user } = await createAndAuthenticateUser(app, { tenantId });
    const userId = user.user.id;

    const { board } = await createTaskBoard(tenantId, userId);

    const response = await request(app.server)
      .post(`/v1/tasks/boards/${board.id}/labels`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Bug', color: '#ef4444' });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('label');
    expect(response.body.label.name).toBe('Bug');
    expect(response.body.label.color).toBe('#ef4444');
  });
});
