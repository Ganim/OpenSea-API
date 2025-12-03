import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { CNPJGenerator } from '@/utils/tests/generators';

describe('Update Supplier (E2E)', () => {
  let managerToken: string;

  beforeAll(async () => {
    await app.ready();

    const { token } = await createAndAuthenticateUser(app, 'MANAGER');
    managerToken = token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be able to update a supplier', async () => {
    const timestamp = Date.now();
    const originalCnpj = CNPJGenerator.generateUnique();
    const updatedCnpj = CNPJGenerator.generateUnique();

    // Create a supplier
    const supplier = await prisma.supplier.create({
      data: {
        name: `Original Supplier ${timestamp}`,
        cnpj: originalCnpj,
        email: `original${timestamp}@example.com`,
        phone: '+55 11 98765-4321',
        city: 'São Paulo',
        state: 'SP',
        isActive: true,
        rating: 3,
      },
    });

    const response = await request(app.server)
      .put(`/v1/suppliers/${supplier.id}`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        name: `Updated Supplier ${timestamp}`,
        cnpj: updatedCnpj,
        email: `updated${timestamp}@example.com`,
        phone: '+55 21 91234-5678',
        city: 'Rio de Janeiro',
        state: 'RJ',
        rating: 5,
        isActive: false,
      });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      supplier: {
        id: supplier.id,
        name: `Updated Supplier ${timestamp}`,
        cnpj: updatedCnpj,
        email: `updated${timestamp}@example.com`,
        phone: '+55 21 91234-5678',
        city: 'Rio de Janeiro',
        state: 'RJ',
        rating: 5,
        isActive: false,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      },
    });
  });

  it('should return 404 when trying to update a non-existent supplier', async () => {
    const response = await request(app.server)
      .put('/v1/suppliers/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        name: 'Updated Name',
      });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Supplier not found');
  });

  it('should return 400 when trying to update with a duplicate CNPJ', async () => {
    const timestamp = Date.now();
    const cnpjA = CNPJGenerator.generateUnique();
    const cnpjB = CNPJGenerator.generateUnique();

    // Create two suppliers
    await prisma.supplier.create({
      data: {
        name: `Supplier A ${timestamp}`,
        cnpj: cnpjA,
        isActive: true,
      },
    });

    const supplierB = await prisma.supplier.create({
      data: {
        name: `Supplier B ${timestamp}`,
        cnpj: cnpjB,
        isActive: true,
      },
    });

    // Try to update Supplier B with the CNPJ of Supplier A
    const response = await request(app.server)
      .put(`/v1/suppliers/${supplierB.id}`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        cnpj: cnpjA,
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      'A supplier with this CNPJ already exists',
    );
  });
});
