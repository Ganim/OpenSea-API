import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createProduct } from '@/utils/tests/factories/stock/create-product.e2e';
import { createVariant } from '@/utils/tests/factories/stock/create-variant.e2e';

describe('List Variant Attachments (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  it('should list variant attachments', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { product } = await createProduct({ tenantId });
    const { variant } = await createVariant({
      tenantId,
      productId: product.id,
    });

    // Create an attachment first
    await request(app.server)
      .post(`/v1/variants/${variant.id}/attachments`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        fileUrl: 'https://example.com/files/variant-list-test.jpg',
        fileName: 'variant-list-test.jpg',
        fileSize: 2048,
        mimeType: 'image/jpeg',
      });

    const response = await request(app.server)
      .get(`/v1/variants/${variant.id}/attachments`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('variantAttachments');
    expect(Array.isArray(response.body.variantAttachments)).toBe(true);
    expect(response.body.variantAttachments.length).toBeGreaterThanOrEqual(1);
  });

  it('should return empty array for variant with no attachments', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { product } = await createProduct({ tenantId });
    const { variant } = await createVariant({
      tenantId,
      productId: product.id,
    });

    const response = await request(app.server)
      .get(`/v1/variants/${variant.id}/attachments`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('variantAttachments');
    expect(response.body.variantAttachments).toHaveLength(0);
  });
});
