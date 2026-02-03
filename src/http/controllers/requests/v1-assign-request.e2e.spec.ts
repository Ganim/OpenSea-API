import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createRequestE2E } from '@/utils/tests/factories/core/create-request.e2e';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('Assign Request (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should assign request with correct schema', async () => {
    const { token, user } = await createAndAuthenticateUser(app, { tenantId });
    const { user: assigneeUser } = await createAndAuthenticateUser(app, { tenantId });

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
