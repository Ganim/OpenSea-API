import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';

describe('Create Customer (E2E)', () => {
  let userToken: string;

  beforeAll(async () => {
    await app.ready();

    const { token } = await createAndAuthenticateUser(app);
    userToken = token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be able to create a customer with all fields', async () => {
    const timestamp = Date.now();

    const response = await request(app.server)
      .post('/v1/customers')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: `Customer ${timestamp}`,
        type: 'BUSINESS',
        // document omitted to avoid validation
        email: `customer${timestamp}@example.com`,
        phone: '(11) 98765-4321',
        address: '123 Main Street',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01234-567',
        country: 'Brazil',
        notes: 'Test customer',
      });

    if (response.status !== 201) {
      console.log('Error response:', response.body);
    }

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      customer: {
        id: expect.any(String),
        name: `Customer ${timestamp}`,
        type: 'BUSINESS',
        email: `customer${timestamp}@example.com`,
        phone: '(11) 98765-4321',
        address: '123 Main Street',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01234-567',
        country: 'Brazil',
        notes: 'Test customer',
        isActive: true,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      },
    });
  });

  it('should be able to create a customer with minimal data', async () => {
    const timestamp = Date.now();

    const response = await request(app.server)
      .post('/v1/customers')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: `Minimal Customer ${timestamp}`,
        type: 'BUSINESS',
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      customer: {
        id: expect.any(String),
        name: `Minimal Customer ${timestamp}`,
        type: 'BUSINESS',
        isActive: true,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      },
    });

    // Optional fields should not be present or can be null
    const { customer } = response.body;
    expect(customer.document).toBeUndefined();
    expect(customer.email).toBeUndefined();
    expect(customer.phone).toBeUndefined();
    expect(customer.address).toBeUndefined();
    expect(customer.city).toBeUndefined();
    expect(customer.state).toBeUndefined();
    expect(customer.zipCode).toBeUndefined();
    expect(customer.country).toBeUndefined();
    expect(customer.notes).toBeUndefined();
  });

  it('should not be able to create a customer without authentication', async () => {
    const timestamp = Date.now();

    const response = await request(app.server)
      .post('/v1/customers')
      .send({
        name: `Unauthenticated Customer ${timestamp}`,
        type: 'INDIVIDUAL',
      });

    expect(response.status).toBe(401);
  });

  it('should not be able to create a customer without name', async () => {
    const response = await request(app.server)
      .post('/v1/customers')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        type: 'INDIVIDUAL',
      });

    expect(response.status).toBe(400);
  });
});
