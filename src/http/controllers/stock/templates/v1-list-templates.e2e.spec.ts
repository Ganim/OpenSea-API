import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('List Templates (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be able to list all templates', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');

    // Create multiple templates
    await request(app.server)
      .post('/v1/templates')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Template A ${Date.now()}`,
        productAttributes: { color: 'string', size: 'string' },
      });

    await request(app.server)
      .post('/v1/templates')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Template B ${Date.now()}`,
        variantAttributes: { sku: 'string' },
      });

    await request(app.server)
      .post('/v1/templates')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Template C ${Date.now()}`,
        itemAttributes: { serialNumber: 'string' },
      });

    // List all templates
    const response = await request(app.server)
      .get('/v1/templates')
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(200);
    expect(response.body.templates).toEqual(expect.any(Array));
    expect(response.body.templates.length).toBeGreaterThanOrEqual(3);
    expect(response.body.templates[0]).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        name: expect.any(String),
        productAttributes: expect.any(Object),
        variantAttributes: expect.any(Object),
        itemAttributes: expect.any(Object),
      }),
    );
  });

  it('should not be able to list templates without authentication', async () => {
    const response = await request(app.server).get('/v1/templates').send();

    expect(response.statusCode).toEqual(401);
  });
});
