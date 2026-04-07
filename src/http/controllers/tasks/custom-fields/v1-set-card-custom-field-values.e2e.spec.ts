import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createTaskBoard } from '@/utils/tests/factories/tasks/create-task-board-test-data.e2e';
import { createTaskCard } from '@/utils/tests/factories/tasks/create-task-card-test-data.e2e';

describe('Set Card Custom Field Values (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should set custom field values for a card', async () => {
    const { token, user } = await createAndAuthenticateUser(app, { tenantId });
    const userId = user.user.id;

    const { board, columns } = await createTaskBoard(tenantId, userId);
    const card = await createTaskCard(board.id, columns[0].id, userId);

    const field = await prisma.boardCustomField.create({
      data: { boardId: board.id, name: 'Pontos', type: 'NUMBER' },
    });

    const response = await request(app.server)
      .put(`/v1/tasks/boards/${board.id}/cards/${card.id}/custom-fields`)
      .set('Authorization', `Bearer ${token}`)
      .send({ values: [{ fieldId: field.id, value: 5 }] });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('values');
    expect(Array.isArray(response.body.values)).toBe(true);
    expect(response.body.values.length).toBe(1);
  });
});
