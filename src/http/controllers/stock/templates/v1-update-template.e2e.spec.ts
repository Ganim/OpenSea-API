import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('Update Template (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be able to update a template', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');

    // Create template
    const createResponse = await request(app.server)
      .post('/v1/templates')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Original Template ${Date.now()}`,
        productAttributes: { color: 'string' },
      });

    const templateId = createResponse.body.template.id;

    // Update template
    const response = await request(app.server)
      .put(`/v1/templates/${templateId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Updated Template ${Date.now()}`,
        variantAttributes: { sku: 'string' },
      });

    expect(response.statusCode).toEqual(200);
    expect(response.body.template).toEqual(
      expect.objectContaining({
        id: templateId,
        name: expect.stringContaining('Updated Template'),
        productAttributes: { color: 'string' }, // Should keep original
        variantAttributes: { sku: 'string' }, // Should update
        itemAttributes: {}, // Should keep empty
      }),
    );
  });

  it('should not be able to update template with duplicate name', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');

    const uniqueName = `Template ${Date.now()}`;

    // Create first template
    await request(app.server)
      .post('/v1/templates')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: uniqueName,
        productAttributes: { color: 'string' },
      });

    // Create second template
    const createResponse2 = await request(app.server)
      .post('/v1/templates')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Another Template ${Date.now()}`,
        variantAttributes: { sku: 'string' },
      });

    const template2Id = createResponse2.body.template.id;

    // Try to update second template with first template's name
    const response = await request(app.server)
      .put(`/v1/templates/${template2Id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: uniqueName, // Duplicate name
      });

    expect(response.statusCode).toEqual(400);
    expect(response.body.message).toEqual(
      'Template with this name already exists',
    );
  });

  it('should return 404 when updating non-existing template', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');

    const nonExistingId = '00000000-0000-0000-0000-000000000000';

    const response = await request(app.server)
      .put(`/v1/templates/${nonExistingId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Updated Name',
      });

    expect(response.statusCode).toEqual(404);
    expect(response.body.message).toEqual('Template not found');
  });

  it('should not be able to update template without authentication', async () => {
    const nonExistingId = '00000000-0000-0000-0000-000000000000';

    const response = await request(app.server)
      .put(`/v1/templates/${nonExistingId}`)
      .send({
        name: 'Updated Name',
      });

    expect(response.statusCode).toEqual(401);
  });
});
