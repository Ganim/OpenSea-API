import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createTaskBoard } from '@/utils/tests/factories/tasks/create-task-board-test-data.e2e';

describe('Reorder Columns (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should reorder columns', async () => {
    const { token, user } = await createAndAuthenticateUser(app, { tenantId });
    const userId = user.user.id;

    const { board, columns } = await createTaskBoard(tenantId, userId);

    // Reverse column order
    const reversedIds = [columns[2].id, columns[1].id, columns[0].id];

    const response = await request(app.server)
      .patch(`/v1/tasks/boards/${board.id}/columns/reorder`)
      .set('Authorization', `Bearer ${token}`)
      .send({ columnIds: reversedIds });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('columns');
    expect(Array.isArray(response.body.columns)).toBe(true);
  });
});
