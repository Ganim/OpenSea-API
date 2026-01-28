import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createRequestE2E } from '@/utils/tests/factories/core/create-request.e2e';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('Cancel Request (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should cancel request with correct schema', async () => {
    const { token, user } = await createAndAuthenticateUser(app);

    const testRequest = await createRequestE2E({
      requesterId: user.user.id,
      status: 'SUBMITTED',
    });

    const response = await request(app.server)
      .patch(`/v1/requests/${testRequest.id}/cancel`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        cancellationReason:
          'Test cancellation reason with more than 10 characters',
      });

    expect(response.status).toBe(200);
    expect(response.body).toBeDefined();

    // Verify status changed in database
    const requestInDb = await prisma.request.findUnique({
      where: { id: testRequest.id },
    });
    expect(requestInDb?.status).toBe('CANCELLED');
  });
});
