import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createTaskBoard } from '@/utils/tests/factories/tasks/create-task-board-test-data.e2e';
import { createTaskCard } from '@/utils/tests/factories/tasks/create-task-card-test-data.e2e';

describe('Delete Card Integration (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  it('should delete a card integration', async () => {
    const { token, user } = await createAndAuthenticateUser(app, { tenantId });
    const userId = user.user.id;

    const { board, columns } = await createTaskBoard(tenantId, userId);
    const card = await createTaskCard(board.id, columns[0].id, userId);

    // Create an integration first
    const createResponse = await request(app.server)
      .post(`/v1/tasks/boards/${board.id}/cards/${card.id}/integrations`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'STORAGE_FILE',
        entityId: '00000000-0000-0000-0000-000000000001',
        entityLabel: 'arquivo-delete.pdf',
      });

    expect(createResponse.status).toBe(201);
    const integrationId = createResponse.body.integration.id;

    // Delete it
    const response = await request(app.server)
      .delete(
        `/v1/tasks/boards/${board.id}/cards/${card.id}/integrations/${integrationId}`,
      )
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(204);
  });

  it('should return 404 for non-existent integration', async () => {
    const { token, user } = await createAndAuthenticateUser(app, { tenantId });
    const userId = user.user.id;

    const { board, columns } = await createTaskBoard(tenantId, userId);
    const card = await createTaskCard(board.id, columns[0].id, userId);

    const response = await request(app.server)
      .delete(
        `/v1/tasks/boards/${board.id}/cards/${card.id}/integrations/00000000-0000-0000-0000-000000000000`,
      )
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server).delete(
      '/v1/tasks/boards/00000000-0000-0000-0000-000000000000/cards/00000000-0000-0000-0000-000000000000/integrations/00000000-0000-0000-0000-000000000000',
    );

    expect(response.status).toBe(401);
  });
});
