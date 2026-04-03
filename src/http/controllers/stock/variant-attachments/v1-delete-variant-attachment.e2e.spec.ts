import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createProduct } from '@/utils/tests/factories/stock/create-product.e2e';
import { createVariant } from '@/utils/tests/factories/stock/create-variant.e2e';

describe('Delete Variant Attachment (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  it('should delete a variant attachment successfully', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { product } = await createProduct({ tenantId });
    const { variant } = await createVariant({
      tenantId,
      productId: product.id,
    });

    // Create an attachment first
    const createResponse = await request(app.server)
      .post(`/v1/variants/${variant.id}/attachments`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        fileUrl: 'https://example.com/files/variant-delete-test.jpg',
        fileName: 'variant-delete-test.jpg',
        fileSize: 512,
        mimeType: 'image/jpeg',
      });

    const attachmentId = createResponse.body.variantAttachment.id;

    const response = await request(app.server)
      .delete(`/v1/variants/${variant.id}/attachments/${attachmentId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(204);

    // Verify it's gone
    const listResponse = await request(app.server)
      .get(`/v1/variants/${variant.id}/attachments`)
      .set('Authorization', `Bearer ${token}`);

    const ids = listResponse.body.variantAttachments.map(
      (a: { id: string }) => a.id,
    );
    expect(ids).not.toContain(attachmentId);
  });

  it('should return 404 for non-existent attachment', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { product } = await createProduct({ tenantId });
    const { variant } = await createVariant({
      tenantId,
      productId: product.id,
    });

    const response = await request(app.server)
      .delete(
        `/v1/variants/${variant.id}/attachments/00000000-0000-0000-0000-000000000000`,
      )
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
  });
});
