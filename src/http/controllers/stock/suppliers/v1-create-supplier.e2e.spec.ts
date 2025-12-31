import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { CNPJGenerator } from '@/utils/tests/generators';

describe('Create Supplier (E2E)', () => {
  let managerToken: string;

  beforeAll(async () => {
    await app.ready();

    const { token } = await createAndAuthenticateUser(app);
    managerToken = token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be able to create a supplier with all fields', async () => {
    const timestamp = Date.now();

    const response = await request(app.server)
      .post('/v1/suppliers')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        name: `Supplier ${timestamp}`,
        taxId: 'TAX123',
        contact: 'John Doe',
        email: `supplier${timestamp}@example.com`,
        phone: '(11) 98765-4321',
        website: 'https://example.com',
        address: '123 Main Street',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01234-567',
        country: 'Brazil',
        paymentTerms: 'Net 30',
        rating: 5,
        isActive: true,
        notes: 'Test supplier',
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      supplier: {
        id: expect.any(String),
        name: `Supplier ${timestamp}`,
        taxId: 'TAX123',
        contact: 'John Doe',
        email: `supplier${timestamp}@example.com`,
        phone: '(11) 98765-4321',
        website: 'https://example.com',
        address: '123 Main Street',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01234-567',
        country: 'Brazil',
        paymentTerms: 'Net 30',
        rating: 5,
        isActive: true,
        notes: 'Test supplier',
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      },
    });
  });

  it('should be able to create a supplier with minimal data', async () => {
    const timestamp = Date.now();

    const response = await request(app.server)
      .post('/v1/suppliers')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        name: `Minimal Supplier ${timestamp}`,
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      supplier: {
        id: expect.any(String),
        name: `Minimal Supplier ${timestamp}`,
        isActive: true,
        createdAt: expect.any(String),
      },
    });
  });

  it('should not be able to create a supplier with duplicate CNPJ', async () => {
    const timestamp = Date.now();
    const duplicateCnpj = CNPJGenerator.generateUnique();

    // Create first supplier
    await request(app.server)
      .post('/v1/suppliers')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        name: `First Supplier ${timestamp}`,
        cnpj: duplicateCnpj,
      });

    // Try to create second supplier with same CNPJ
    const response = await request(app.server)
      .post('/v1/suppliers')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        name: `Second Supplier ${timestamp}`,
        cnpj: duplicateCnpj,
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      'A supplier with this CNPJ already exists',
    );
  });

  it('should not be able to create a supplier without authentication', async () => {
    const timestamp = Date.now();

    const response = await request(app.server)
      .post('/v1/suppliers')
      .send({
        name: `Unauthorized Supplier ${timestamp}`,
      });

    expect(response.status).toBe(401);
  });
});
