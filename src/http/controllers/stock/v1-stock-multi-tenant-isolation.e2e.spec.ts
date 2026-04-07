import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createProduct } from '@/utils/tests/factories/stock/create-product.e2e';
import { createItemE2E } from '@/utils/tests/factories/stock/create-item.e2e';
import { createWarehouse } from '@/utils/tests/factories/stock/create-warehouse.e2e';
import { createCategory } from '@/utils/tests/factories/stock/create-category.e2e';
import { createSupplier } from '@/utils/tests/factories/stock/create-supplier.e2e';
import { createManufacturer } from '@/utils/tests/factories/stock/create-manufacturer.e2e';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('Stock Multi-Tenant Isolation (E2E)', () => {
  // Tenant A
  let tenantAId: string;
  let _tokenA: string;
  let productAId: string;
  let itemAId: string;
  let warehouseAId: string;
  let categoryAId: string;
  let supplierAId: string;
  let manufacturerAId: string;

  // Tenant B
  let tenantBId: string;
  let tokenB: string;

  beforeAll(async () => {
    await app.ready();

    // ── Tenant A setup ──────────────────────────────────────────────────
    const { tenantId: tidA } = await createAndSetupTenant({
      name: 'Stock Isolation - Tenant A',
    });
    tenantAId = tidA;

    const authA = await createAndAuthenticateUser(app, {
      tenantId: tenantAId,
    });
    _tokenA = authA.token;

    // Create product for Tenant A
    const { product } = await createProduct({ tenantId: tenantAId });
    productAId = product.id;

    // Create item for Tenant A
    const { item } = await createItemE2E({ tenantId: tenantAId });
    itemAId = item.id;

    // Create warehouse for Tenant A
    const { warehouse } = await createWarehouse({ tenantId: tenantAId });
    warehouseAId = warehouse.id;

    // Create category for Tenant A
    const { categoryId } = await createCategory({ tenantId: tenantAId });
    categoryAId = categoryId;

    // Create supplier for Tenant A
    const { supplierId } = await createSupplier({ tenantId: tenantAId });
    supplierAId = supplierId;

    // Create manufacturer for Tenant A
    const { manufacturerId } = await createManufacturer({
      tenantId: tenantAId,
    });
    manufacturerAId = manufacturerId;

    // ── Tenant B setup ──────────────────────────────────────────────────
    const { tenantId: tidB } = await createAndSetupTenant({
      name: 'Stock Isolation - Tenant B',
    });
    tenantBId = tidB;

    const authB = await createAndAuthenticateUser(app, {
      tenantId: tenantBId,
    });
    tokenB = authB.token;
  }, 60000);

  // ── LIST Products isolation ─────────────────────────────────────────

  it('should not return products from another tenant', async () => {
    const response = await request(app.server)
      .get('/v1/products')
      .set('Authorization', `Bearer ${tokenB}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('products');

    const productIds = response.body.products.map((p: { id: string }) => p.id);
    expect(productIds).not.toContain(productAId);
  });

  // ── GET Product by ID isolation ─────────────────────────────────────

  it('should not return a product from another tenant by ID', async () => {
    const response = await request(app.server)
      .get(`/v1/products/${productAId}`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(response.status).toBe(404);
  });

  // ── LIST Items isolation ────────────────────────────────────────────

  it('should not return items from another tenant', async () => {
    const response = await request(app.server)
      .get('/v1/items')
      .set('Authorization', `Bearer ${tokenB}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('items');

    const itemIds = response.body.items.map((i: { id: string }) => i.id);
    expect(itemIds).not.toContain(itemAId);
  });

  // ── GET Item by ID isolation ────────────────────────────────────────

  it('should not return an item from another tenant by ID', async () => {
    const response = await request(app.server)
      .get(`/v1/items/${itemAId}`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(response.status).toBe(404);
  });

  // ── LIST Warehouses isolation ───────────────────────────────────────

  it('should not return warehouses from another tenant', async () => {
    const response = await request(app.server)
      .get('/v1/warehouses')
      .set('Authorization', `Bearer ${tokenB}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('warehouses');

    const warehouseIds = response.body.warehouses.map(
      (w: { id: string }) => w.id,
    );
    expect(warehouseIds).not.toContain(warehouseAId);
  });

  // ── GET Warehouse by ID isolation ───────────────────────────────────

  it('should not return a warehouse from another tenant by ID', async () => {
    const response = await request(app.server)
      .get(`/v1/warehouses/${warehouseAId}`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(response.status).toBe(404);
  });

  // ── LIST Categories isolation ───────────────────────────────────────

  it('should not return categories from another tenant', async () => {
    const response = await request(app.server)
      .get('/v1/categories')
      .set('Authorization', `Bearer ${tokenB}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('categories');

    const categoryIds = response.body.categories.map(
      (c: { id: string }) => c.id,
    );
    expect(categoryIds).not.toContain(categoryAId);
  });

  // ── GET Category by ID isolation ──────────────────────────────────

  it('should not return a category from another tenant by ID', async () => {
    const response = await request(app.server)
      .get(`/v1/categories/${categoryAId}`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(response.status).toBe(404);
  });

  // ── LIST Suppliers isolation ──────────────────────────────────────

  it('should not return suppliers from another tenant', async () => {
    const response = await request(app.server)
      .get('/v1/suppliers')
      .set('Authorization', `Bearer ${tokenB}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('suppliers');

    const supplierIds = response.body.suppliers.map(
      (s: { id: string }) => s.id,
    );
    expect(supplierIds).not.toContain(supplierAId);
  });

  // ── GET Supplier by ID isolation ──────────────────────────────────

  it('should not return a supplier from another tenant by ID', async () => {
    const response = await request(app.server)
      .get(`/v1/suppliers/${supplierAId}`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(response.status).toBe(404);
  });

  // ── LIST Manufacturers isolation ──────────────────────────────────

  it('should not return manufacturers from another tenant', async () => {
    const response = await request(app.server)
      .get('/v1/manufacturers')
      .set('Authorization', `Bearer ${tokenB}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('manufacturers');

    const manufacturerIds = response.body.manufacturers.map(
      (m: { id: string }) => m.id,
    );
    expect(manufacturerIds).not.toContain(manufacturerAId);
  });

  // ── GET Manufacturer by ID isolation ──────────────────────────────

  it('should not return a manufacturer from another tenant by ID', async () => {
    const response = await request(app.server)
      .get(`/v1/manufacturers/${manufacturerAId}`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(response.status).toBe(404);
  });
});
