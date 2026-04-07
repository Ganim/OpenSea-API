import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createProduct } from '@/utils/tests/factories/stock/create-product.e2e';

describe('Bulk Import Stress Tests (E2E)', () => {
  let tenantId: string;
  let token: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;

    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;
  }, 300000);

  /**
   * Creates a template with a unique code to avoid fullCode collisions
   * between batches. Each bulk import batch should use its own template
   * because the sequential code generator can produce overlapping fullCodes
   * across separate bulk calls sharing the same template.
   */
  async function createUniqueTemplate(label: string) {
    const template = await prisma.template.create({
      data: {
        tenantId,
        name: `Stress ${label} ${Date.now()}`,
        code: `S${label.slice(0, 2).toUpperCase()}`,
        productAttributes: {},
        variantAttributes: {},
        itemAttributes: {},
      },
    });
    return template;
  }

  function generateProducts(
    count: number,
    prefix: string,
    templateId: string,
  ): Array<{ name: string; templateId: string }> {
    const ts = Date.now();
    return Array.from({ length: count }, (_, i) => ({
      name: `${prefix} Product ${i + 1} ${ts}`,
      templateId,
    }));
  }

  async function sendProductBatch(
    products: Array<{ name: string; templateId: string }>,
  ) {
    return request(app.server)
      .post('/v1/products/bulk')
      .set('Authorization', `Bearer ${token}`)
      .send({ products });
  }

  function generateVariants(
    count: number,
    productId: string,
    prefix: string,
  ): Array<{ name: string; productId: string }> {
    const ts = Date.now();
    return Array.from({ length: count }, (_, i) => ({
      name: `${prefix} Variant ${i + 1} ${ts}`,
      productId,
    }));
  }

  async function sendVariantBatch(
    variants: Array<{ name: string; productId: string }>,
  ) {
    return request(app.server)
      .post('/v1/variants/bulk')
      .set('Authorization', `Bearer ${token}`)
      .send({ variants });
  }

  it('should import 500 products in 5 batches of 100', async () => {
    let totalCreated = 0;
    const batchSize = 100;
    const totalBatches = 5;

    for (let batch = 0; batch < totalBatches; batch++) {
      // Each batch uses its own template to avoid fullCode collisions
      const template = await createUniqueTemplate(`b${batch}`);
      const products = generateProducts(
        batchSize,
        `Batch${batch}`,
        template.id,
      );
      const response = await sendProductBatch(products);

      expect(response.status).toBe(201);
      expect(response.body.created).toHaveLength(batchSize);
      expect(response.body.errors).toHaveLength(0);
      totalCreated += response.body.created.length;
    }

    expect(totalCreated).toBe(500);
  }, 120000);

  it('should import 500 variants in 5 batches of 100', async () => {
    const template = await createUniqueTemplate('var');
    const { product } = await createProduct({
      tenantId,
      name: `Variant Stress Product ${Date.now()}`,
      templateId: template.id,
    });

    let totalCreated = 0;
    const batchSize = 100;
    const totalBatches = 5;

    for (let batch = 0; batch < totalBatches; batch++) {
      const variants = generateVariants(
        batchSize,
        product.id,
        `VBatch${batch}`,
      );
      const response = await sendVariantBatch(variants);

      expect(response.status).toBe(201);
      expect(response.body.created).toHaveLength(batchSize);
      expect(response.body.errors).toHaveLength(0);
      totalCreated += response.body.created.length;
    }

    expect(totalCreated).toBe(500);
  }, 120000);

  it('should skip duplicates across batches', async () => {
    const template = await createUniqueTemplate('dup');
    const timestamp = Date.now();
    const products = Array.from({ length: 100 }, (_, i) => ({
      name: `Dedup Product ${i + 1} ${timestamp}`,
      templateId: template.id,
    }));

    // First batch: create all
    const first = await sendProductBatch(products);
    expect(first.status).toBe(201);
    expect(first.body.created).toHaveLength(100);

    // Second batch: same names, skipDuplicates — all should be skipped
    const second = await request(app.server)
      .post('/v1/products/bulk')
      .set('Authorization', `Bearer ${token}`)
      .send({ products, options: { skipDuplicates: true } });

    expect(second.status).toBe(201);
    expect(second.body.created).toHaveLength(0);
    expect(second.body.skipped).toHaveLength(100);
  }, 60000);

  it('should handle concurrent batch imports without conflicts', async () => {
    const batchSize = 100;
    const totalBatches = 5;

    // Create unique templates before firing concurrent requests
    const templates = await Promise.all(
      Array.from({ length: totalBatches }, (_, i) =>
        createUniqueTemplate(`c${i}`),
      ),
    );

    const promises = Array.from({ length: totalBatches }, (_, batch) => {
      const products = generateProducts(
        batchSize,
        `Concurrent${batch}`,
        templates[batch].id,
      );
      return sendProductBatch(products);
    });

    const results = await Promise.all(promises);

    let totalCreated = 0;
    for (const response of results) {
      expect(response.status).toBe(201);
      expect(response.body.errors).toHaveLength(0);
      totalCreated += response.body.created.length;
    }

    expect(totalCreated).toBe(500);
  }, 120000);
});
