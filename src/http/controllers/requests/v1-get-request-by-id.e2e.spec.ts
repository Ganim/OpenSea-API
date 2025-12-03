import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import type { FastifyInstance } from 'fastify';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

let token: string;
let user: { user: { id: string } };

describe('Get Request by ID (E2E)', () => {
  beforeAll(async () => {
    await app.ready();

    const authData = await createAndAuthenticateUser(
      app as unknown as FastifyInstance,
      'USER',
    );
    token = authData.token;
    user = authData.user;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be able to get a request by id', async () => {
    const timestamp = Date.now();

    // Create a test request
    const testRequest = await prisma.request.create({
      data: {
        title: `Test Request ${timestamp}`,
        description: 'Test description for get by id',
        type: 'ACCESS_REQUEST',
        priority: 'MEDIUM',
        status: 'SUBMITTED',
        targetType: 'USER',
        targetId: user.user.id,
        requesterId: user.user.id,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const response = await request(app.server)
      .get(`/v1/requests/${testRequest.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toBeDefined();
    expect(response.body.id).toBe(testRequest.id);
    expect(response.body.title).toBe(`Test Request ${timestamp}`);
    expect(response.body.description).toBe('Test description for get by id');
    expect(response.body.type).toBe('ACCESS_REQUEST');
    expect(response.body.status).toBe('SUBMITTED');
    expect(response.body.requesterId).toBe(user.user.id);
  });

  it('should not be able to get a request that does not exist', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';

    const response = await request(app.server)
      .get(`/v1/requests/${fakeId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Request not found');
  });

  it('should not be able to get a request without authentication', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';

    const response = await request(app.server).get(`/v1/requests/${fakeId}`);

    expect(response.status).toBe(401);
  });

  it('should not be able to get a request with invalid id format', async () => {
    const response = await request(app.server)
      .get('/v1/requests/invalid-id')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(400);
  });
});
