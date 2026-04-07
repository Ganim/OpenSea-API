import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createTaskBoard } from '@/utils/tests/factories/tasks/create-task-board-test-data.e2e';

describe('List Boards (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should list boards with pagination', async () => {
    const { token, user } = await createAndAuthenticateUser(app, { tenantId });
    const userId = user.user.id;

    await createTaskBoard(tenantId, userId);

    const response = await request(app.server)
      .get('/v1/tasks/boards')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('boards');
    expect(response.body).toHaveProperty('meta');
    expect(Array.isArray(response.body.boards)).toBe(true);
    expect(response.body.meta).toHaveProperty('total');
    expect(response.body.meta).toHaveProperty('page');
    expect(response.body.meta).toHaveProperty('limit');
    expect(response.body.meta).toHaveProperty('pages');
  });
});
