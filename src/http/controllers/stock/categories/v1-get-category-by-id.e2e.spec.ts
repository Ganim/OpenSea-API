import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import type { FastifyInstance } from 'fastify';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

let token: string;

describe('Get Category By ID (E2E)', () => {
  beforeAll(async () => {
    await app.ready();

    const { token: authToken } = await createAndAuthenticateUser(
      app as unknown as FastifyInstance,
      'USER',
    );
    token = authToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be able to get a category by id', async () => {
    const timestamp = Date.now();

    // Create a category
    const category = await prisma.category.create({
      data: {
        name: `Test Category ${timestamp}`,
        slug: `test-category-${timestamp}`,
        description: 'Test description',
        displayOrder: 1,
        isActive: true,
      },
    });

    const response = await request(app.server)
      .get(`/v1/categories/${category.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.category).toEqual(
      expect.objectContaining({
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        displayOrder: category.displayOrder,
        isActive: category.isActive,
      }),
    );
  });

  it('should return 404 if category does not exist', async () => {
    const response = await request(app.server)
      .get('/v1/categories/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Category not found.');
  });
});
