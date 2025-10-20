import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { CNPJGenerator } from '@/utils/tests/generators';

describe('List Suppliers (E2E)', () => {
  let token: string;

  beforeAll(async () => {
    await app.ready();

    const { token: authToken } = await createAndAuthenticateUser(
      app,
      'MANAGER',
    );
    token = authToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be able to list suppliers', async () => {
    const timestamp = Date.now();
    const cnpjA = CNPJGenerator.generateUnique();
    const cnpjB = CNPJGenerator.generateUnique();

    // Create multiple suppliers
    await prisma.supplier.createMany({
      data: [
        {
          name: `Supplier A ${timestamp}`,
          cnpj: cnpjA,
          email: `suppliera${timestamp}@example.com`,
          phone: '+55 11 98765-4321',
          city: 'São Paulo',
          state: 'SP',
          isActive: true,
          rating: 5,
        },
        {
          name: `Supplier B ${timestamp}`,
          cnpj: cnpjB,
          email: `supplierb${timestamp}@example.com`,
          city: 'Rio de Janeiro',
          state: 'RJ',
          isActive: true,
          rating: 4,
        },
        {
          name: `Supplier C ${timestamp}`,
          city: 'Belo Horizonte',
          state: 'MG',
          isActive: false,
        },
      ],
    });

    const response = await request(app.server)
      .get('/v1/suppliers')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.suppliers).toBeInstanceOf(Array);
    expect(response.body.suppliers.length).toBeGreaterThanOrEqual(3);

    // Verify the structure of suppliers in the response
    const supplierA = response.body.suppliers.find(
      (s: { name: string }) => s.name === `Supplier A ${timestamp}`,
    );
    const supplierB = response.body.suppliers.find(
      (s: { name: string }) => s.name === `Supplier B ${timestamp}`,
    );
    const supplierC = response.body.suppliers.find(
      (s: { name: string }) => s.name === `Supplier C ${timestamp}`,
    );

    expect(supplierA).toMatchObject({
      id: expect.any(String),
      name: `Supplier A ${timestamp}`,
      cnpj: cnpjA,
      email: `suppliera${timestamp}@example.com`,
      phone: '+55 11 98765-4321',
      city: 'São Paulo',
      state: 'SP',
      isActive: true,
      rating: 5,
      createdAt: expect.any(String),
    });

    expect(supplierB).toMatchObject({
      id: expect.any(String),
      name: `Supplier B ${timestamp}`,
      cnpj: cnpjB,
      email: `supplierb${timestamp}@example.com`,
      city: 'Rio de Janeiro',
      state: 'RJ',
      isActive: true,
      rating: 4,
      createdAt: expect.any(String),
    });

    expect(supplierC).toMatchObject({
      id: expect.any(String),
      name: `Supplier C ${timestamp}`,
      city: 'Belo Horizonte',
      state: 'MG',
      isActive: false,
      createdAt: expect.any(String),
    });
  });
});
