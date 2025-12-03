import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import type { FastifyInstance } from 'fastify';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

let token: string;

describe('Delete Category (E2E)', () => {
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

  it('should be able to delete a category', async () => {
    const timestamp = Date.now();

    const category = await prisma.category.create({
      data: {
        name: `Category to Delete ${timestamp}`,
        slug: `category-to-delete-${timestamp}`,
        displayOrder: 1,
        isActive: true,
      },
    });

    const response = await request(app.server)
      .delete(`/v1/categories/${category.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(204);

    const deletedCategory = await prisma.category.findUnique({
      where: { id: category.id },
    });

    expect(deletedCategory?.deletedAt).not.toBeNull();
  });

  it('should return 404 if category does not exist', async () => {
    const response = await request(app.server)
      .delete('/v1/categories/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Category not found.');
  });
});
