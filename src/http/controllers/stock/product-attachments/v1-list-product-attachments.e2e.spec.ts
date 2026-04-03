import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createProduct } from '@/utils/tests/factories/stock/create-product.e2e';

describe('List Product Attachments (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  it('should list product attachments', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { product } = await createProduct({ tenantId });

    // Create an attachment first
    await request(app.server)
      .post(`/v1/products/${product.id}/attachments`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        fileUrl: 'https://example.com/files/list-test.jpg',
        fileName: 'list-test.jpg',
        fileSize: 2048,
        mimeType: 'image/jpeg',
      });

    const response = await request(app.server)
      .get(`/v1/products/${product.id}/attachments`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('productAttachments');
    expect(Array.isArray(response.body.productAttachments)).toBe(true);
    expect(response.body.productAttachments.length).toBeGreaterThanOrEqual(1);
  });

  it('should return empty array for product with no attachments', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { product } = await createProduct({ tenantId });

    const response = await request(app.server)
      .get(`/v1/products/${product.id}/attachments`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('productAttachments');
    expect(response.body.productAttachments).toHaveLength(0);
  });
});
