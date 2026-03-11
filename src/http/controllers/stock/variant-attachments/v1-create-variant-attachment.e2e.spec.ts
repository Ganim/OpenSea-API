import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createProduct } from '@/utils/tests/factories/stock/create-product.e2e';
import { createVariant } from '@/utils/tests/factories/stock/create-variant.e2e';

describe('Create Variant Attachment (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create a variant attachment successfully', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { product } = await createProduct({ tenantId });
    const { variant } = await createVariant({
      tenantId,
      productId: product.id,
    });

    const response = await request(app.server)
      .post(`/v1/variants/${variant.id}/attachments`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        fileUrl: 'https://example.com/files/variant-photo.jpg',
        fileName: 'variant-photo.jpg',
        fileSize: 2048,
        mimeType: 'image/jpeg',
        label: 'Foto da variante',
        order: 0,
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('variantAttachment');
    expect(response.body.variantAttachment).toHaveProperty('id');
    expect(response.body.variantAttachment).toHaveProperty(
      'variantId',
      variant.id,
    );
    expect(response.body.variantAttachment).toHaveProperty(
      'fileName',
      'variant-photo.jpg',
    );
  });

  it('should return 404 for non-existent variant', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post('/v1/variants/00000000-0000-0000-0000-000000000000/attachments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        fileUrl: 'https://example.com/files/photo.jpg',
        fileName: 'photo.jpg',
        fileSize: 1024,
        mimeType: 'image/jpeg',
      });

    expect(response.status).toBe(404);
  });

  it('should not create attachment without auth token', async () => {
    const response = await request(app.server)
      .post('/v1/variants/00000000-0000-0000-0000-000000000000/attachments')
      .send({
        fileUrl: 'https://example.com/files/photo.jpg',
        fileName: 'photo.jpg',
        fileSize: 1024,
        mimeType: 'image/jpeg',
      });

    expect(response.status).toBe(401);
  });
});
