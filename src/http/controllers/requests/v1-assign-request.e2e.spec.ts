import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createRequestE2E } from '@/utils/tests/factories/core/create-request.e2e';
import type { FastifyInstance } from 'fastify';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

let token: string;
let user: { user: { id: string } };
let adminToken: string;

describe('Assign Request (E2E)', () => {
  beforeAll(async () => {
    await app.ready();

    const userAuthData = await createAndAuthenticateUser(
      app as unknown as FastifyInstance,
      'USER',
    );
    token = userAuthData.token;
    user = userAuthData.user;

    const adminAuthData = await createAndAuthenticateUser(
      app as unknown as FastifyInstance,
      'ADMIN',
    );
    adminToken = adminAuthData.token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be able to assign a request to a user', async () => {
    const adminAuthData = await createAndAuthenticateUser(
      app as unknown as FastifyInstance,
      'ADMIN',
    );

    // Create a test request
    const testRequest = await createRequestE2E({
      targetId: user.user.id,
      requesterId: user.user.id,
    });

    const response = await request(app.server)
      .patch(`/v1/requests/${testRequest.id}/assign`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        assignedToId: adminAuthData.user.user.id,
      });

    expect(response.status).toBe(200);
    expect(response.body).toBeDefined();

    // Verify request was assigned in database
    const requestInDb = await prisma.request.findUnique({
      where: { id: testRequest.id },
    });

    expect(requestInDb).toBeDefined();
    expect(requestInDb?.assignedToId).toBe(adminAuthData.user.user.id);
    expect(requestInDb?.status).toBe('IN_PROGRESS');
  });

  it('should not be able to assign a request without admin privileges', async () => {
    const adminAuthData = await createAndAuthenticateUser(
      app as unknown as FastifyInstance,
      'ADMIN',
    );

    // Create a test request
    const testRequest = await createRequestE2E({
      targetId: user.user.id,
      requesterId: user.user.id,
    });

    const response = await request(app.server)
      .patch(`/v1/requests/${testRequest.id}/assign`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        assignedToId: adminAuthData.user.user.id,
      });

    expect(response.status).toBe(403);
  });

  it('should not be able to assign a request without authentication', async () => {
    const adminAuthData = await createAndAuthenticateUser(
      app as unknown as FastifyInstance,
      'ADMIN',
    );
    const fakeId = '00000000-0000-0000-0000-000000000000';

    const response = await request(app.server)
      .patch(`/v1/requests/${fakeId}/assign`)
      .send({
        assignedToId: adminAuthData.user.user.id,
      });

    expect(response.status).toBe(401);
  });

  it('should not be able to assign a request that does not exist', async () => {
    const adminAuthData = await createAndAuthenticateUser(
      app as unknown as FastifyInstance,
      'ADMIN',
    );
    const fakeId = '00000000-0000-0000-0000-000000000000';

    const response = await request(app.server)
      .patch(`/v1/requests/${fakeId}/assign`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        assignedToId: adminAuthData.user.user.id,
      });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Request not found');
  });

  it('should not be able to assign a request with invalid id format', async () => {
    const adminAuthData = await createAndAuthenticateUser(
      app as unknown as FastifyInstance,
      'ADMIN',
    );

    const response = await request(app.server)
      .patch('/v1/requests/invalid-id/assign')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        assignedToId: adminAuthData.user.user.id,
      });

    expect(response.status).toBe(400);
  });
});
