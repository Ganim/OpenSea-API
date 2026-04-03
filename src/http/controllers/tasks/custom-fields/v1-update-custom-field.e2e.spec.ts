import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createTaskBoard } from '@/utils/tests/factories/tasks/create-task-board-test-data.e2e';

describe('Update Custom Field (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  it('should update a custom field', async () => {
    const { token, user } = await createAndAuthenticateUser(app, { tenantId });
    const userId = user.user.id;

    const { board } = await createTaskBoard(tenantId, userId);

    const field = await prisma.boardCustomField.create({
      data: { boardId: board.id, name: 'Nome Original', type: 'TEXT' },
    });

    const response = await request(app.server)
      .patch(`/v1/tasks/boards/${board.id}/custom-fields/${field.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Nome Atualizado', isRequired: true });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('customField');
    expect(response.body.customField.name).toBe('Nome Atualizado');
    expect(response.body.customField.isRequired).toBe(true);
  });

  it('should return 401 when not authenticated', async () => {
    const response = await request(app.server)
      .patch(
        `/v1/tasks/boards/00000000-0000-0000-0000-000000000000/custom-fields/00000000-0000-0000-0000-000000000000`,
      )
      .send({ name: 'Teste' });

    expect(response.status).toBe(401);
  });
});
