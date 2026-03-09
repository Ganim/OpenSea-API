import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createTaskBoard } from '@/utils/tests/factories/tasks/create-task-board-test-data.e2e';
import { createTaskCard } from '@/utils/tests/factories/tasks/create-task-card-test-data.e2e';

describe('Move Card Concurrency (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should handle simultaneous card moves without data corruption', async () => {
    const { token, user } = await createAndAuthenticateUser(app, { tenantId });
    const userId = user.user.id;

    const { board, columns } = await createTaskBoard(tenantId, userId);

    // Create 3 cards in the first column
    const card1 = await createTaskCard(board.id, columns[0].id, userId, {
      title: 'Card 1',
    });
    const card2 = await createTaskCard(board.id, columns[0].id, userId, {
      title: 'Card 2',
    });
    const card3 = await createTaskCard(board.id, columns[0].id, userId, {
      title: 'Card 3',
    });

    // Fire 3 move requests in parallel — each card moves to a different column
    const results = await Promise.all([
      request(app.server)
        .patch(`/v1/tasks/boards/${board.id}/cards/${card1.id}/move`)
        .set('Authorization', `Bearer ${token}`)
        .send({ columnId: columns[1].id, position: 0 }),
      request(app.server)
        .patch(`/v1/tasks/boards/${board.id}/cards/${card2.id}/move`)
        .set('Authorization', `Bearer ${token}`)
        .send({ columnId: columns[2].id, position: 0 }),
      request(app.server)
        .patch(`/v1/tasks/boards/${board.id}/cards/${card3.id}/move`)
        .set('Authorization', `Bearer ${token}`)
        .send({ columnId: columns[1].id, position: 1 }),
    ]);

    // All moves should succeed
    for (const result of results) {
      expect(result.status).toBe(200);
      expect(result.body).toHaveProperty('card');
    }

    // Verify each card ended up in the correct column
    expect(results[0].body.card.columnId).toBe(columns[1].id);
    expect(results[1].body.card.columnId).toBe(columns[2].id);
    expect(results[2].body.card.columnId).toBe(columns[1].id);
  });

  it('should handle rapid sequential moves (A -> B -> C)', async () => {
    const { token, user } = await createAndAuthenticateUser(app, { tenantId });
    const userId = user.user.id;

    const { board, columns } = await createTaskBoard(tenantId, userId);
    const card = await createTaskCard(board.id, columns[0].id, userId, {
      title: 'Cartão Viajante',
    });

    // Move: column 0 -> column 1
    const move1 = await request(app.server)
      .patch(`/v1/tasks/boards/${board.id}/cards/${card.id}/move`)
      .set('Authorization', `Bearer ${token}`)
      .send({ columnId: columns[1].id, position: 0 });

    expect(move1.status).toBe(200);
    expect(move1.body.card.columnId).toBe(columns[1].id);

    // Move: column 1 -> column 2
    const move2 = await request(app.server)
      .patch(`/v1/tasks/boards/${board.id}/cards/${card.id}/move`)
      .set('Authorization', `Bearer ${token}`)
      .send({ columnId: columns[2].id, position: 0 });

    expect(move2.status).toBe(200);
    expect(move2.body.card.columnId).toBe(columns[2].id);

    // Verify the card's final position by fetching it
    const getResponse = await request(app.server)
      .get(`/v1/tasks/boards/${board.id}/cards/${card.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(getResponse.status).toBe(200);
    expect(getResponse.body.card.columnId).toBe(columns[2].id);
  });

  it('should maintain consistent state after parallel moves of the same card', async () => {
    const { token, user } = await createAndAuthenticateUser(app, { tenantId });
    const userId = user.user.id;

    const { board, columns } = await createTaskBoard(tenantId, userId);
    const card = await createTaskCard(board.id, columns[0].id, userId, {
      title: 'Cartão Disputado',
    });

    // Fire parallel moves of the same card to different columns
    // One should win, but the final state must be consistent
    const results = await Promise.all([
      request(app.server)
        .patch(`/v1/tasks/boards/${board.id}/cards/${card.id}/move`)
        .set('Authorization', `Bearer ${token}`)
        .send({ columnId: columns[1].id, position: 0 }),
      request(app.server)
        .patch(`/v1/tasks/boards/${board.id}/cards/${card.id}/move`)
        .set('Authorization', `Bearer ${token}`)
        .send({ columnId: columns[2].id, position: 0 }),
    ]);

    // Both requests should return 200 (no crashes/500s)
    for (const result of results) {
      expect(result.status).toBe(200);
    }

    // Verify the card is in exactly one column (consistent final state)
    const getResponse = await request(app.server)
      .get(`/v1/tasks/boards/${board.id}/cards/${card.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(getResponse.status).toBe(200);
    const finalColumnId = getResponse.body.card.columnId;

    // The card must be in one of the target columns
    expect([columns[1].id, columns[2].id]).toContain(finalColumnId);
  });
});
