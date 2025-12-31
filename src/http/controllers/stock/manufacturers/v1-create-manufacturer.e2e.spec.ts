import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';

describe('Create Manufacturer (E2E)', () => {
  let managerToken: string;

  beforeAll(async () => {
    await app.ready();

    const { token } = await createAndAuthenticateUser(app);
    managerToken = token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be able to create a manufacturer', async () => {
    const timestamp = Date.now();

    const response = await request(app.server)
      .post('/v1/manufacturers')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        name: `Manufacturer ${timestamp}`,
        country: 'United States',
        email: `manufacturer${timestamp}@example.com`,
        phone: '+1-555-0100',
        website: `https://manufacturer${timestamp}.com`,
        addressLine1: '123 Main Street',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        rating: 4.5,
        notes: 'Test manufacturer',
        isActive: true,
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      manufacturer: {
        id: expect.any(String),
        name: `Manufacturer ${timestamp}`,
        country: 'United States',
        email: `manufacturer${timestamp}@example.com`,
        phone: '+1-555-0100',
        website: `https://manufacturer${timestamp}.com`,
        addressLine1: '123 Main Street',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        rating: 4.5,
        notes: 'Test manufacturer',
        isActive: true,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      },
    });
  });

  it('should be able to create a manufacturer with minimal data', async () => {
    const timestamp = Date.now();

    const response = await request(app.server)
      .post('/v1/manufacturers')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        name: `Minimal Manufacturer ${timestamp}`,
        country: 'Brazil',
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      manufacturer: {
        id: expect.any(String),
        name: `Minimal Manufacturer ${timestamp}`,
        country: 'Brazil',
        isActive: true,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      },
    });
  });

  it('should not be able to create a manufacturer with duplicate name', async () => {
    const timestamp = Date.now();
    const name = `Duplicate Manufacturer ${timestamp}`;

    await request(app.server)
      .post('/v1/manufacturers')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        name,
        country: 'United States',
      });

    const response = await request(app.server)
      .post('/v1/manufacturers')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        name,
        country: 'United States',
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('already exists');
  });

  it('should not be able to create a manufacturer without authentication', async () => {
    const timestamp = Date.now();

    const response = await request(app.server)
      .post('/v1/manufacturers')
      .send({
        name: `Manufacturer ${timestamp}`,
        country: 'United States',
      });

    expect(response.status).toBe(401);
  });
});
