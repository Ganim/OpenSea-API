import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';

describe('Set Product Care Instructions (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should set care instructions for a product', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const timestamp = Date.now();
    const templateDb = await prisma.template.create({
      data: {
        name: `Template Care Test ${timestamp}`,
        productAttributes: {},
        variantAttributes: {},
        itemAttributes: {},
      },
    });

    const productDb = await prisma.product.create({
      data: {
        name: `Product Care Test ${timestamp}`,
        status: 'ACTIVE',
        templateId: templateDb.id,
        attributes: {},
      },
    });

    const careInstructionIds = ['WASH_30', 'DO_NOT_BLEACH', 'IRON_150'];

    const response = await request(app.server)
      .put(`/v1/products/${productDb.id}/care`)
      .set('Authorization', `Bearer ${token}`)
      .send({ careInstructionIds });

    expect(response.status).toBe(200);
    expect(response.body.careInstructionIds).toEqual(careInstructionIds);
    expect(response.body.careInstructions).toHaveLength(3);
    expect(response.body.careInstructions[0]).toMatchObject({
      id: 'WASH_30',
      code: 'WASH_30',
      category: 'WASH',
      assetPath: expect.any(String),
      label: expect.any(String),
    });
  });

  it('should return 404 for non-existent product', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const nonExistentId = '00000000-0000-0000-0000-000000000000';

    const response = await request(app.server)
      .put(`/v1/products/${nonExistentId}/care`)
      .set('Authorization', `Bearer ${token}`)
      .send({ careInstructionIds: ['WASH_30'] });

    expect(response.status).toBe(404);
    expect(response.body.message).toContain('not found');
  });

  it('should return 400 for invalid care instruction IDs', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const timestamp = Date.now();
    const templateDb = await prisma.template.create({
      data: {
        name: `Template Invalid Care Test ${timestamp}`,
        productAttributes: {},
        variantAttributes: {},
        itemAttributes: {},
      },
    });

    const productDb = await prisma.product.create({
      data: {
        name: `Product Invalid Care Test ${timestamp}`,
        status: 'ACTIVE',
        templateId: templateDb.id,
        attributes: {},
      },
    });

    const response = await request(app.server)
      .put(`/v1/products/${productDb.id}/care`)
      .set('Authorization', `Bearer ${token}`)
      .send({ careInstructionIds: ['INVALID_CODE_123', 'WASH_30'] });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('INVALID_CODE_123');
  });

  it('should return 400 for duplicate care instruction IDs', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const timestamp = Date.now();
    const templateDb = await prisma.template.create({
      data: {
        name: `Template Duplicate Care Test ${timestamp}`,
        productAttributes: {},
        variantAttributes: {},
        itemAttributes: {},
      },
    });

    const productDb = await prisma.product.create({
      data: {
        name: `Product Duplicate Care Test ${timestamp}`,
        status: 'ACTIVE',
        templateId: templateDb.id,
        attributes: {},
      },
    });

    const response = await request(app.server)
      .put(`/v1/products/${productDb.id}/care`)
      .set('Authorization', `Bearer ${token}`)
      .send({ careInstructionIds: ['WASH_30', 'WASH_30', 'IRON_150'] });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('Duplicate');
  });

  it('should be able to clear care instructions', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const timestamp = Date.now();
    const templateDb = await prisma.template.create({
      data: {
        name: `Template Clear Care Test ${timestamp}`,
        productAttributes: {},
        variantAttributes: {},
        itemAttributes: {},
      },
    });

    const productDb = await prisma.product.create({
      data: {
        name: `Product Clear Care Test ${timestamp}`,
        status: 'ACTIVE',
        templateId: templateDb.id,
        attributes: {},
        careInstructionIds: ['WASH_30', 'IRON_150'],
      },
    });

    const response = await request(app.server)
      .put(`/v1/products/${productDb.id}/care`)
      .set('Authorization', `Bearer ${token}`)
      .send({ careInstructionIds: [] });

    expect(response.status).toBe(200);
    expect(response.body.careInstructionIds).toEqual([]);
    expect(response.body.careInstructions).toHaveLength(0);
  });

  it('should return 401 without authentication', async () => {
    const timestamp = Date.now();
    const templateDb = await prisma.template.create({
      data: {
        name: `Template No Auth Care Test ${timestamp}`,
        productAttributes: {},
        variantAttributes: {},
        itemAttributes: {},
      },
    });

    const productDb = await prisma.product.create({
      data: {
        name: `Product No Auth Care Test ${timestamp}`,
        status: 'ACTIVE',
        templateId: templateDb.id,
        attributes: {},
      },
    });

    const response = await request(app.server)
      .put(`/v1/products/${productDb.id}/care`)
      .send({ careInstructionIds: ['WASH_30'] });

    expect(response.status).toBe(401);
  });
});
