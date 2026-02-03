import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Update Category (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should update category with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const timestamp = Date.now();

    const category = await prisma.category.create({
      data: {
        tenantId,
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
        iconUrl: 'https://example.com/icons/updated.svg',
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('category');
    expect(response.body.category).toHaveProperty('id', category.id);
    expect(response.body.category).toHaveProperty(
      'name',
      `New Name ${timestamp}`,
    );
    expect(response.body.category).toHaveProperty(
      'iconUrl',
      'https://example.com/icons/updated.svg',
    );
  });
});
