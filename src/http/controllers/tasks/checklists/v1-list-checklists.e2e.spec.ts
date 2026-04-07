import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createTaskBoard } from '@/utils/tests/factories/tasks/create-task-board-test-data.e2e';
import { createTaskCard } from '@/utils/tests/factories/tasks/create-task-card-test-data.e2e';

describe('List Checklists (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should list all checklists for a card', async () => {
    const { token, user } = await createAndAuthenticateUser(app, { tenantId });
    const userId = user.user.id;

    const { board, columns } = await createTaskBoard(tenantId, userId);
    const card = await createTaskCard(board.id, columns[0].id, userId);

    // Create two checklists
    await request(app.server)
      .post(`/v1/tasks/boards/${board.id}/cards/${card.id}/checklists`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Checklist A' });

    await request(app.server)
      .post(`/v1/tasks/boards/${board.id}/cards/${card.id}/checklists`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Checklist B' });

    const response = await request(app.server)
      .get(`/v1/tasks/boards/${board.id}/cards/${card.id}/checklists`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('checklists');
    expect(response.body.checklists).toHaveLength(2);
    expect(response.body.checklists[0].title).toBe('Checklist A');
    expect(response.body.checklists[1].title).toBe('Checklist B');
    expect(response.body.checklists[0]).toHaveProperty('items');
  });
});
