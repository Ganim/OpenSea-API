import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import type { FastifyInstance } from 'fastify';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

let token: string;

describe('Update Category (E2E)', () => {
  beforeAll(async () => {
    await app.ready();

    const { token: authToken } = await createAndAuthenticateUser(
      app as unknown as FastifyInstance,
      'MANAGER',
    );
    token = authToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be able to update a category', async () => {
    const timestamp = Date.now();

    const category = await prisma.category.create({
      data: {
        name: `Old Name ${timestamp}`,
        slug: `old-slug-${timestamp}`,
        displayOrder: 1,
        isActive: true,
      },
    });

    const response = await request(app.server)
      .put(`/v1/categories/${category.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `New Name ${timestamp}`,
        slug: `new-slug-${timestamp}`,
        description: 'Updated description',
        displayOrder: 5,
        isActive: false,
      });

    expect(response.status).toBe(200);
    expect(response.body.category).toEqual(
      expect.objectContaining({
        id: category.id,
        name: `New Name ${timestamp}`,
        slug: `new-slug-${timestamp}`,
        description: 'Updated description',
        displayOrder: 5,
        isActive: false,
      }),
    );
  });

  it('should return 404 if category does not exist', async () => {
    const response = await request(app.server)
      .put('/v1/categories/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Updated Name',
      });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Category not found.');
  });
});
