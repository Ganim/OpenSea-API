import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Validate Bulk Products (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should validate and return correct response shape', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const timestamp = Date.now();

    const template = await prisma.template.create({
      data: {
        tenantId,
        name: `Template Validate ${timestamp}`,
        productAttributes: {},
        variantAttributes: {},
        itemAttributes: {},
      },
    });

    const response = await request(app.server)
      .post('/v1/products/bulk/validate')
      .set('Authorization', `Bearer ${token}`)
      .send({
        productNames: ['Product A', 'Product B'],
        categoryNames: ['NonExistent Category'],
        manufacturerNames: [],
        templateId: template.id,
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('duplicateProducts');
    expect(response.body).toHaveProperty('missingCategories');
    expect(response.body).toHaveProperty('templateValid', true);
    expect(response.body.missingCategories).toContain('NonExistent Category');
  });
});
