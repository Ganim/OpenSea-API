import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import type { FastifyInstance } from 'fastify';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

let token: string;
let user: { user: { id: string } };

describe('List Requests (E2E)', () => {
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

  it('should be able to list requests', async () => {
    const timestamp = Date.now();

    // Create a test request
    await prisma.request.create({
      data: {
        title: `Test Request ${timestamp}`,
        description: 'Test description',
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
      .get('/v1/requests')
      .set('Authorization', `Bearer ${token}`)
      .query({ page: 1 });

    expect(response.status).toBe(200);
    expect(response.body).toBeDefined();
    expect(Array.isArray(response.body.requests)).toBe(true);
    expect(response.body.meta).toBeDefined();
    expect(response.body.meta.page).toBe(1);
    expect(response.body.meta.perPage).toBe(20);
    expect(typeof response.body.meta.total).toBe('number');
  });

  it('should be able to filter requests by status', async () => {
    const timestamp = Date.now();

    // Create a request with specific status
    await prisma.request.create({
      data: {
        title: `Completed Request ${timestamp}`,
        description: 'Test description',
        type: 'ACCESS_REQUEST',
        priority: 'MEDIUM',
        status: 'COMPLETED',
        targetType: 'USER',
        targetId: user.user.id,
        requesterId: user.user.id,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const response = await request(app.server)
      .get('/v1/requests')
      .set('Authorization', `Bearer ${token}`)
      .query({ status: 'COMPLETED', page: 1, limit: 10 });

    expect(response.status).toBe(200);
    expect(response.body).toBeDefined();
    expect(Array.isArray(response.body.requests)).toBe(true);

    // All returned requests should have COMPLETED status
    response.body.requests.forEach((request: { status: string }) => {
      expect(request.status).toBe('COMPLETED');
    });
  });

  it('should be able to filter requests by type', async () => {
    const timestamp = Date.now();

    // Create a request with specific type
    await prisma.request.create({
      data: {
        title: `Purchase Request ${timestamp}`,
        description: 'Test description',
        type: 'PURCHASE_REQUEST',
        priority: 'HIGH',
        status: 'SUBMITTED',
        targetType: 'USER',
        targetId: user.user.id,
        requesterId: user.user.id,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const response = await request(app.server)
      .get('/v1/requests')
      .set('Authorization', `Bearer ${token}`)
      .query({ type: 'PURCHASE_REQUEST', page: 1, limit: 10 });

    expect(response.status).toBe(200);
    expect(response.body).toBeDefined();
    expect(Array.isArray(response.body.requests)).toBe(true);

    // All returned requests should have PURCHASE_REQUEST type
    response.body.requests.forEach((request: { type: string }) => {
      expect(request.type).toBe('PURCHASE_REQUEST');
    });
  });

  it('should not be able to list requests without authentication', async () => {
    const response = await request(app.server)
      .get('/v1/requests')
      .query({ page: 1, limit: 10 });

    expect(response.status).toBe(401);
  });

  it('should return empty array when no requests match filters', async () => {
    const response = await request(app.server)
      .get('/v1/requests')
      .set('Authorization', `Bearer ${token}`)
      .query({ status: 'CANCELLED', page: 1, limit: 10 });

    expect(response.status).toBe(200);
    expect(response.body).toBeDefined();
    expect(Array.isArray(response.body.requests)).toBe(true);
    expect(response.body.requests.length).toBe(0);
  });
});
