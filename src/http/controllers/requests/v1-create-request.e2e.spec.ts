import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import type { FastifyInstance } from 'fastify';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

let token: string;
let user: { user: { id: string } };

describe('Create Request (E2E)', () => {
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

  it('should be able to create a request', async () => {
    const timestamp = Date.now();

    const response = await request(app.server)
      .post('/v1/requests')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: `Test Request ${timestamp}`,
        description: 'This is a test request description',
        type: 'ACCESS_REQUEST',
        priority: 'MEDIUM',
        targetType: 'USER',
        targetId: user.user.id,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      });

    expect(response.status).toBe(201);
    expect(response.body).toBeDefined();
    expect(response.body.title).toBe(`Test Request ${timestamp}`);
    expect(response.body.status).toBe('SUBMITTED');

    // Verify request was created in database
    const requestInDb = await prisma.request.findUnique({
      where: { id: response.body.id },
    });

    expect(requestInDb).toBeDefined();
    expect(requestInDb?.title).toBe(`Test Request ${timestamp}`);
    expect(requestInDb?.status).toBe('SUBMITTED');
  });

  it('should not be able to create a request without authentication', async () => {
    const response = await request(app.server)
      .post('/v1/requests')
      .send({
        title: 'Test Request',
        description: 'This is a test request description',
        type: 'ACCESS_REQUEST',
        priority: 'MEDIUM',
        targetType: 'USER',
        targetId: 'some-user-id',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });

    expect(response.status).toBe(401);
  });

  it('should not be able to create a request with invalid data', async () => {
    const response = await request(app.server)
      .post('/v1/requests')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: '', // Invalid: empty title
        description: 'This is a test request description',
        type: 'INVALID_TYPE', // Invalid type
        priority: 'MEDIUM',
        targetType: 'USER',
        targetId: 'some-user-id',
        dueDate: 'invalid-date', // Invalid date
      });

    expect(response.status).toBe(400);
  });
});
