import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createProduct } from '@/utils/tests/factories/stock/create-product.e2e';

describe('Create Product Attachment (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should create a product attachment successfully', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { product } = await createProduct({ tenantId });

    const response = await request(app.server)
      .post(`/v1/products/${product.id}/attachments`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        fileUrl: 'https://example.com/files/photo.jpg',
        fileName: 'photo.jpg',
        fileSize: 1024,
        mimeType: 'image/jpeg',
        label: 'Foto principal',
        order: 0,
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('productAttachment');
    expect(response.body.productAttachment).toHaveProperty('id');
    expect(response.body.productAttachment).toHaveProperty(
      'productId',
      product.id,
    );
    expect(response.body.productAttachment).toHaveProperty(
      'fileName',
      'photo.jpg',
    );
  });

  it('should return 404 for non-existent product', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post('/v1/products/00000000-0000-0000-0000-000000000000/attachments')
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
    const { product } = await createProduct({ tenantId });

    const response = await request(app.server)
      .post(`/v1/products/${product.id}/attachments`)
      .send({
        fileUrl: 'https://example.com/files/photo.jpg',
        fileName: 'photo.jpg',
        fileSize: 1024,
        mimeType: 'image/jpeg',
      });

    expect(response.status).toBe(401);
  });
});
