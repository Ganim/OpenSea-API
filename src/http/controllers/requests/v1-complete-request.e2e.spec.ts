import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createRequestE2E } from '@/utils/tests/factories/core/create-request.e2e';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('Complete Request (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should complete request with correct schema', async () => {
    const { token: assignedToken, user: assignedUser } =
      await createAndAuthenticateUser(app, { tenantId });
    const { user: requesterUser } = await createAndAuthenticateUser(app, { tenantId });

    const testRequest = await createRequestE2E({
      targetId: requesterUser.user.id,
      requesterId: requesterUser.user.id,
      status: 'IN_PROGRESS',
      assignedToId: assignedUser.user.id,
    });

    const response = await request(app.server)
      .patch(`/v1/requests/${testRequest.id}/complete`)
      .set('Authorization', `Bearer ${assignedToken}`)
      .send({});

    expect(response.status).toBe(200);
    expect(response.body).toBeDefined();

    // Verify status changed in database
    const requestInDb = await prisma.request.findUnique({
      where: { id: testRequest.id },
    });
    expect(requestInDb?.status).toBe('COMPLETED');
    expect(requestInDb?.completedAt).toBeDefined();
  });
});
