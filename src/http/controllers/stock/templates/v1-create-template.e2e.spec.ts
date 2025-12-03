import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('Create Template (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be able to create a template with all attributes', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');

    const response = await app.inject({
      method: 'POST',
      url: '/v1/templates',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      payload: {
        name: `Full Template ${Date.now()}`,
        productAttributes: {
          brand: 'string',
          model: 'string',
          year: 'number',
        },
        variantAttributes: {
          color: 'string',
          size: 'string',
        },
        itemAttributes: {
          serialNumber: 'string',
          condition: 'string',
        },
      },
    });

    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.body);
    expect(body.template).toMatchObject({
      id: expect.any(String),
      name: expect.stringContaining('Full Template'),
      productAttributes: {
        brand: 'string',
        model: 'string',
        year: 'number',
      },
      variantAttributes: {
        color: 'string',
        size: 'string',
      },
      itemAttributes: {
        serialNumber: 'string',
        condition: 'string',
      },
    });
  });

  it('should be able to create a template with only product attributes', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');

    const response = await app.inject({
      method: 'POST',
      url: '/v1/templates',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      payload: {
        name: `Product Only Template ${Date.now()}`,
        productAttributes: {
          category: 'string',
          type: 'string',
        },
      },
    });

    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.body);
    expect(body.template).toMatchObject({
      id: expect.any(String),
      name: expect.stringContaining('Product Only Template'),
      productAttributes: {
        category: 'string',
        type: 'string',
      },
      variantAttributes: {},
      itemAttributes: {},
    });
  });

  it('should not be able to create a template with duplicate name', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');

    const uniqueName = `Duplicate Template ${Date.now()}`;

    // Create first template
    await app.inject({
      method: 'POST',
      url: '/v1/templates',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      payload: {
        name: uniqueName,
        productAttributes: { test: 'value' },
      },
    });

    // Try to create duplicate
    const response = await app.inject({
      method: 'POST',
      url: '/v1/templates',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      payload: {
        name: uniqueName,
        productAttributes: { test: 'value2' },
      },
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.message).toContain('already exists');
  });

  it('should be able to create a template without any attributes', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');

    const response = await app.inject({
      method: 'POST',
      url: '/v1/templates',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      payload: {
        name: `No Attributes Template ${Date.now()}`,
      },
    });

    expect(response.statusCode).toBe(201);
  });

  it('should not be able to create a template without authentication', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/v1/templates',
      payload: {
        name: `Unauthorized Template ${Date.now()}`,
        productAttributes: { test: 'value' },
      },
    });

    expect(response.statusCode).toBe(401);
  });
});
