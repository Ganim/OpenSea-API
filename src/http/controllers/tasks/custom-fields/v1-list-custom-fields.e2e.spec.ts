import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createTaskBoard } from '@/utils/tests/factories/tasks/create-task-board-test-data.e2e';

describe('List Custom Fields (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should list custom fields for a board', async () => {
    const { token, user } = await createAndAuthenticateUser(app, { tenantId });
    const userId = user.user.id;

    const { board } = await createTaskBoard(tenantId, userId);

    await prisma.boardCustomField.createMany({
      data: [
        { boardId: board.id, name: 'Prioridade', type: 'TEXT' },
        { boardId: board.id, name: 'Estimativa', type: 'NUMBER' },
      ],
    });

    const response = await request(app.server)
      .get(`/v1/tasks/boards/${board.id}/custom-fields`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('customFields');
    expect(response.body.customFields).toHaveLength(2);
  });

  it('should return empty array when board has no custom fields', async () => {
    const { token, user } = await createAndAuthenticateUser(app, { tenantId });
    const userId = user.user.id;

    const { board } = await createTaskBoard(tenantId, userId);

    const response = await request(app.server)
      .get(`/v1/tasks/boards/${board.id}/custom-fields`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.customFields).toHaveLength(0);
  });

  it('should return 401 when not authenticated', async () => {
    const response = await request(app.server).get(
      `/v1/tasks/boards/00000000-0000-0000-0000-000000000000/custom-fields`,
    );

    expect(response.status).toBe(401);
  });
});
