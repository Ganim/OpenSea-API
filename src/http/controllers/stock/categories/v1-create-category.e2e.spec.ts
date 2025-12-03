import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import type { FastifyInstance } from 'fastify';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

let token: string;

describe('Create Category (E2E)', () => {
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

  it('should be able to create a category', async () => {
    const timestamp = Date.now();

    const response = await request(app.server)
      .post('/v1/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Electronics ${timestamp}`,
        description: 'Electronic products',
        isActive: true,
      });

    expect(response.status).toBe(201);
    expect(response.body.category).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        name: `Electronics ${timestamp}`,
        slug: `electronics-${timestamp}`,
        description: 'Electronic products',
        isActive: true,
      }),
    );
  });

  it('should be able to create a category with custom slug', async () => {
    const timestamp = Date.now();

    const response = await request(app.server)
      .post('/v1/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Custom Category ${timestamp}`,
        slug: `custom-slug-${timestamp}`,
      });

    expect(response.status).toBe(201);
    expect(response.body.category.slug).toBe(`custom-slug-${timestamp}`);
  });

  it('should be able to create a subcategory', async () => {
    const timestamp = Date.now();

    // Create parent category
    const parentCategory = await prisma.category.create({
      data: {
        name: `Parent Category ${timestamp}`,
        slug: `parent-${timestamp}`,
        isActive: true,
      },
    });

    const response = await request(app.server)
      .post('/v1/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Child Category ${timestamp}`,
        parentId: parentCategory.id,
      });

    expect(response.status).toBe(201);
    expect(response.body.category.parentId).toBe(parentCategory.id);
  });

  it('should not be able to create a category with duplicate name', async () => {
    const timestamp = Date.now();
    const categoryName = `Duplicate Category ${timestamp}`;

    // Create first category
    await prisma.category.create({
      data: {
        name: categoryName,
        slug: `duplicate-${timestamp}`,
        isActive: true,
      },
    });

    // Try to create second category with same name
    const response = await request(app.server)
      .post('/v1/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: categoryName,
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      'A category with this name already exists.',
    );
  });

  it('should not be able to create a category with duplicate slug', async () => {
    const timestamp = Date.now();
    const slug = `duplicate-slug-${timestamp}`;

    // Create first category
    await prisma.category.create({
      data: {
        name: `First Category ${timestamp}`,
        slug,
        isActive: true,
      },
    });

    // Try to create second category with same slug
    const response = await request(app.server)
      .post('/v1/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Second Category ${timestamp}`,
        slug,
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      'A category with this slug already exists.',
    );
  });

  it('should return 400 if parent category does not exist', async () => {
    const response = await request(app.server)
      .post('/v1/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Orphan Category',
        parentId: '00000000-0000-0000-0000-000000000000',
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Parent category not found.');
  });
});
