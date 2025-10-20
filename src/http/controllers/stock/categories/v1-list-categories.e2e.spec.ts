import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import type { FastifyInstance } from 'fastify';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

let token: string;

describe('List Categories (E2E)', () => {
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

  it('should be able to list all categories', async () => {
    const timestamp = Date.now();

    // Create categories
    await prisma.category.createMany({
      data: [
        {
          name: `Category A ${timestamp}`,
          slug: `category-a-${timestamp}`,
          displayOrder: 1,
          isActive: true,
        },
        {
          name: `Category B ${timestamp}`,
          slug: `category-b-${timestamp}`,
          displayOrder: 2,
          isActive: true,
        },
      ],
    });

    const response = await request(app.server)
      .get('/v1/categories')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.categories).toBeInstanceOf(Array);
    expect(response.body.categories.length).toBeGreaterThanOrEqual(2);

    // Verify the structure of each category
    for (const category of response.body.categories) {
      expect(category).toHaveProperty('id');
      expect(category).toHaveProperty('name');
      expect(category).toHaveProperty('slug');
      expect(category).toHaveProperty('displayOrder');
      expect(category).toHaveProperty('isActive');
      expect(category).toHaveProperty('createdAt');
      expect(category).toHaveProperty('updatedAt');
    }
  });
});
