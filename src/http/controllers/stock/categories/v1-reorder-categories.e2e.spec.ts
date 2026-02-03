import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Reorder Categories (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should reorder categories', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const timestamp = Date.now();

    const cat1 = await prisma.category.create({
      data: {
        tenantId,
        name: `Category A ${timestamp}`,
        slug: `category-a-${timestamp}`,
        displayOrder: 0,
        isActive: true,
      },
    });

    const cat2 = await prisma.category.create({
      data: {
        tenantId,
        name: `Category B ${timestamp}`,
        slug: `category-b-${timestamp}`,
        displayOrder: 1,
        isActive: true,
      },
    });

    const response = await request(app.server)
      .patch('/v1/categories/reorder')
      .set('Authorization', `Bearer ${token}`)
      .send({
        items: [
          { id: cat1.id, displayOrder: 1 },
          { id: cat2.id, displayOrder: 0 },
        ],
      });

    expect(response.status).toBe(204);

    const updatedCat1 = await prisma.category.findUnique({
      where: { id: cat1.id },
    });
    const updatedCat2 = await prisma.category.findUnique({
      where: { id: cat2.id },
    });

    expect(updatedCat1?.displayOrder).toBe(1);
    expect(updatedCat2?.displayOrder).toBe(0);
  });
});
