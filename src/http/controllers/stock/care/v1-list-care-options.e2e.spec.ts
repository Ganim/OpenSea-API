import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('List Care Options (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should list all care options grouped by category', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const response = await request(app.server)
      .get('/v1/care/options')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.options).toBeDefined();
    expect(response.body.options.WASH).toBeInstanceOf(Array);
    expect(response.body.options.BLEACH).toBeInstanceOf(Array);
    expect(response.body.options.DRY).toBeInstanceOf(Array);
    expect(response.body.options.IRON).toBeInstanceOf(Array);
    expect(response.body.options.PROFESSIONAL).toBeInstanceOf(Array);

    // Check that options have the correct structure
    if (response.body.options.WASH.length > 0) {
      expect(response.body.options.WASH[0]).toMatchObject({
        id: expect.any(String),
        code: expect.any(String),
        category: 'WASH',
        assetPath: expect.any(String),
        label: expect.any(String),
      });
    }
  });

  it('should not list care options without authentication', async () => {
    const response = await request(app.server).get('/v1/care/options');

    expect(response.status).toBe(401);
  });
});
