import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryManufacturersRepository } from '@/repositories/stock/in-memory/in-memory-manufacturers-repository';
import { InMemoryProductsRepository } from '@/repositories/stock/in-memory/in-memory-products-repository';
import { InMemoryPurchaseOrdersRepository } from '@/repositories/stock/in-memory/in-memory-purchase-orders-repository';
import { InMemorySuppliersRepository } from '@/repositories/stock/in-memory/in-memory-suppliers-repository';
import { InMemoryTemplatesRepository } from '@/repositories/stock/in-memory/in-memory-templates-repository';
import { InMemoryVariantsRepository } from '@/repositories/stock/in-memory/in-memory-variants-repository';
import { templateAttr } from '@/utils/tests/factories/stock/make-template';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateProductUseCase } from '../products/create-product';
import { CreateSupplierUseCase } from '../suppliers/create-supplier';
import { CreateTemplateUseCase } from '../templates/create-template';
import { CreateVariantUseCase } from '../variants/create-variant';
import { CreatePurchaseOrderUseCase } from './create-purchase-order';

let purchaseOrdersRepository: InMemoryPurchaseOrdersRepository;
let suppliersRepository: InMemorySuppliersRepository;
let variantsRepository: InMemoryVariantsRepository;
let productsRepository: InMemoryProductsRepository;
let templatesRepository: InMemoryTemplatesRepository;
let manufacturersRepository: InMemoryManufacturersRepository;
let createSupplier: CreateSupplierUseCase;
let createVariant: CreateVariantUseCase;
let createProduct: CreateProductUseCase;
let createTemplate: CreateTemplateUseCase;
let sut: CreatePurchaseOrderUseCase;

describe('CreatePurchaseOrderUseCase', () => {
  beforeEach(() => {
    purchaseOrdersRepository = new InMemoryPurchaseOrdersRepository();
    suppliersRepository = new InMemorySuppliersRepository();
    productsRepository = new InMemoryProductsRepository();
    templatesRepository = new InMemoryTemplatesRepository();
    manufacturersRepository = new InMemoryManufacturersRepository();
    variantsRepository = new InMemoryVariantsRepository();

    createSupplier = new CreateSupplierUseCase(suppliersRepository);
    createTemplate = new CreateTemplateUseCase(templatesRepository);
    createProduct = new CreateProductUseCase(
      productsRepository,
      templatesRepository,
      suppliersRepository,
      manufacturersRepository,
    );
    createVariant = new CreateVariantUseCase(
      variantsRepository,
      productsRepository,
      templatesRepository,
    );

    sut = new CreatePurchaseOrderUseCase(
      purchaseOrdersRepository,
      suppliersRepository,
      variantsRepository,
    );
  });

  it('should be able to create a purchase order', async () => {
    const { supplier } = await createSupplier.execute({
      tenantId: 'tenant-1',
      name: 'Test Supplier',
    });

    const { template } = await createTemplate.execute({
      tenantId: 'tenant-1',
      name: 'Test Template',
      productAttributes: { brand: templateAttr.string() },
      variantAttributes: { color: templateAttr.string() },
    });

    const { product } = await createProduct.execute({
      tenantId: 'tenant-1',
      name: 'Test Product',

      templateId: template.id.toString(),
      attributes: { brand: 'Test Brand' },
    });

    const variant = await createVariant.execute({
      tenantId: 'tenant-1',
      productId: product.id.toString(),
      sku: 'TEST-001',
      name: 'Test Variant',
      price: 100,
      attributes: { color: 'Blue' },
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      orderNumber: 'PO-001',
      supplierId: supplier.id.toString(),
      expectedDate: new Date('2025-12-31'),
      notes: 'Test purchase order',
      items: [
        {
          variantId: variant.id.toString(),
          quantity: 10,
          unitCost: 15.5,
          notes: 'Test item',
        },
      ],
    });

    expect(result.purchaseOrder).toBeDefined();
    expect(result.purchaseOrder.orderNumber).toBe('PO-001');
    expect(result.purchaseOrder.items).toHaveLength(1);
    expect(result.purchaseOrder.totalCost).toBe(155); // 10 * 15.5
    expect(result.purchaseOrder.status).toBe('PENDING');
  });

  it('should not be able to create a purchase order with empty order number', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        orderNumber: '',
        supplierId: 'supplier-1',
        items: [
          {
            variantId: 'variant-1',
            quantity: 10,
            unitCost: 15.5,
          },
        ],
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should not be able to create a purchase order with duplicate order number', async () => {
    const { supplier } = await createSupplier.execute({
      tenantId: 'tenant-1',
      name: 'Test Supplier',
    });

    const { template } = await createTemplate.execute({
      tenantId: 'tenant-1',
      name: 'Test Template',
      productAttributes: { brand: templateAttr.string() },
      variantAttributes: { color: templateAttr.string() },
    });

    const { product } = await createProduct.execute({
      tenantId: 'tenant-1',
      name: 'Test Product',

      templateId: template.id.toString(),
      attributes: { brand: 'Test Brand' },
    });

    const variant = await createVariant.execute({
      tenantId: 'tenant-1',
      productId: product.id.toString(),
      sku: 'TEST-001',
      name: 'Test Variant',
      price: 100,
      attributes: { color: 'Blue' },
    });

    await sut.execute({
      tenantId: 'tenant-1',
      orderNumber: 'PO-001',
      supplierId: supplier.id.toString(),
      items: [
        {
          variantId: variant.id.toString(),
          quantity: 10,
          unitCost: 15.5,
        },
      ],
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        orderNumber: 'PO-001',
        supplierId: supplier.id.toString(),
        items: [
          {
            variantId: variant.id.toString(),
            quantity: 5,
            unitCost: 20,
          },
        ],
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should not be able to create a purchase order with nonexistent supplier', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        orderNumber: 'PO-001',
        supplierId: 'nonexistent-supplier',
        items: [
          {
            variantId: 'variant-1',
            quantity: 10,
            unitCost: 15.5,
          },
        ],
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should not be able to create a purchase order without items', async () => {
    const { supplier } = await createSupplier.execute({
      tenantId: 'tenant-1',
      name: 'Test Supplier',
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        orderNumber: 'PO-001',
        supplierId: supplier.id.toString(),
        items: [],
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should not be able to create a purchase order with nonexistent variant', async () => {
    const { supplier } = await createSupplier.execute({
      tenantId: 'tenant-1',
      name: 'Test Supplier',
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        orderNumber: 'PO-001',
        supplierId: supplier.id.toString(),
        items: [
          {
            variantId: 'nonexistent-variant',
            quantity: 10,
            unitCost: 15.5,
          },
        ],
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should not be able to create a purchase order with invalid quantity', async () => {
    const { supplier } = await createSupplier.execute({
      tenantId: 'tenant-1',
      name: 'Test Supplier',
    });

    const { template } = await createTemplate.execute({
      tenantId: 'tenant-1',
      name: 'Test Template',
      productAttributes: { brand: templateAttr.string() },
      variantAttributes: { color: templateAttr.string() },
    });

    const { product } = await createProduct.execute({
      tenantId: 'tenant-1',
      name: 'Test Product',

      templateId: template.id.toString(),
      attributes: { brand: 'Test Brand' },
    });

    const variant = await createVariant.execute({
      tenantId: 'tenant-1',
      productId: product.id.toString(),
      sku: 'TEST-001',
      name: 'Test Variant',
      price: 100,
      attributes: { color: 'Blue' },
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        orderNumber: 'PO-001',
        supplierId: supplier.id.toString(),
        items: [
          {
            variantId: variant.id.toString(),
            quantity: 0,
            unitCost: 15.5,
          },
        ],
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should not be able to create a purchase order with negative unit cost', async () => {
    const { supplier } = await createSupplier.execute({
      tenantId: 'tenant-1',
      name: 'Test Supplier',
    });

    const { template } = await createTemplate.execute({
      tenantId: 'tenant-1',
      name: 'Test Template',
      productAttributes: { brand: templateAttr.string() },
      variantAttributes: { color: templateAttr.string() },
    });

    const { product } = await createProduct.execute({
      tenantId: 'tenant-1',
      name: 'Test Product',

      templateId: template.id.toString(),
      attributes: { brand: 'Test Brand' },
    });

    const variant = await createVariant.execute({
      tenantId: 'tenant-1',
      productId: product.id.toString(),
      sku: 'TEST-001',
      name: 'Test Variant',
      price: 100,
      attributes: { color: 'Blue' },
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        orderNumber: 'PO-001',
        supplierId: supplier.id.toString(),
        items: [
          {
            variantId: variant.id.toString(),
            quantity: 10,
            unitCost: -15.5,
          },
        ],
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
