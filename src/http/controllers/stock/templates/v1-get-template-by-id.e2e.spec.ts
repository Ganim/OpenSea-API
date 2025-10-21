import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('Get Template By ID (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be able to get a template by id', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');

    // Create template
    const createResponse = await request(app.server)
      .post('/v1/templates')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Template ${Date.now()}`,
        productAttributes: { color: 'string', size: 'string' },
        variantAttributes: { sku: 'string' },
        itemAttributes: { serialNumber: 'string' },
      });

    const templateId = createResponse.body.template.id;

    // Get template by ID
    const response = await request(app.server)
      .get(`/v1/templates/${templateId}`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(200);
    expect(response.body.template).toEqual(
      expect.objectContaining({
        id: templateId,
        name: expect.any(String),
        productAttributes: { color: 'string', size: 'string' },
        variantAttributes: { sku: 'string' },
        itemAttributes: { serialNumber: 'string' },
      }),
    );
  });

  it('should return 404 when template does not exist', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');

    const fakeId = 'f8c8c8c8-c8c8-c8c8-c8c8-c8c8c8c8c8c8';

    const response = await request(app.server)
      .get(`/v1/templates/${fakeId}`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(404);
    expect(response.body.message).toEqual('Template not found');
  });

  it('should not be able to get a template without authentication', async () => {
    const response = await request(app.server)
      .get('/v1/templates/f8c8c8c8-c8c8-c8c8-c8c8-c8c8c8c8c8c8')
      .send();

    expect(response.statusCode).toEqual(401);
  });
});
