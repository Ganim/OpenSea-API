import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createRequestE2E } from '@/utils/tests/factories/core/create-request.e2e';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('Provide Info (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should provide info with correct schema', async () => {
    const { token, user } = await createAndAuthenticateUser(app);
    const { user: assignedUser } = await createAndAuthenticateUser(app);

    const testRequest = await createRequestE2E({
      requesterId: user.user.id,
      status: 'PENDING_INFO',
      assignedToId: assignedUser.user.id,
    });

    const response = await request(app.server)
      .patch(`/v1/requests/${testRequest.id}/provide-info`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        informationProvided:
          'Here is the additional information you requested with more than 10 characters',
      });

    expect(response.status).toBe(200);
    expect(response.body).toBeDefined();

    // Verify status changed to SUBMITTED
    const requestInDb = await prisma.request.findUnique({
      where: { id: testRequest.id },
    });
    expect(requestInDb?.status).toBe('SUBMITTED');
  });
});
