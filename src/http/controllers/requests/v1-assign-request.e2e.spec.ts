import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createRequestE2E } from '@/utils/tests/factories/core/create-request.e2e';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('Assign Request (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should assign request with correct schema', async () => {
    const { token, user } = await createAndAuthenticateUser(app);
    const { user: assigneeUser } = await createAndAuthenticateUser(app);

    const testRequest = await createRequestE2E({
      targetId: user.user.id,
      requesterId: user.user.id,
    });

    const response = await request(app.server)
      .patch(`/v1/requests/${testRequest.id}/assign`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        assignedToId: assigneeUser.user.id,
      });

    expect(response.status).toBe(200);
    expect(response.body).toBeDefined();

    // Verify assignment in database
    const requestInDb = await prisma.request.findUnique({
      where: { id: testRequest.id },
    });
    expect(requestInDb?.assignedToId).toBe(assigneeUser.user.id);
    expect(requestInDb?.status).toBe('IN_PROGRESS');
  });
});
