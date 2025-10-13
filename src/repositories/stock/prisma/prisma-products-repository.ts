import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import { Product } from '@/entities/stock/product';
import { ProductStatus } from '@/entities/stock/value-objects/product-status';
import { UnitOfMeasure } from '@/entities/stock/value-objects/unit-of-measure';
import { prisma } from '@/lib/prisma';
import type {
  ProductStatus as PrismaProductStatus,
  UnitOfMeasure as PrismaUnitOfMeasure,
} from '@prisma/client';
import type {
  CreateProductSchema,
  ProductsRepository,
  UpdateProductSchema,
} from '../products-repository';

export class PrismaProductsRepository implements ProductsRepository {
  async create(data: CreateProductSchema): Promise<Product> {
    const productData = await prisma.product.create({
      data: {
        name: data.name,
        code: data.code,
        description: data.description,
        status: data.status.value as PrismaProductStatus,
        unitOfMeasure: data.unitOfMeasure.value as PrismaUnitOfMeasure,
        attributes: (data.attributes ?? {}) as never,
        templateId: data.templateId.toString(), // Obrigatório
        supplierId: data.supplierId?.toString(),
        manufacturerId: data.manufacturerId?.toString(),
      },
    });

    const defaultStatus = ProductStatus.create('DRAFT');
    const defaultUnitOfMeasure = UnitOfMeasure.create('UNITS');

    return Product.create(
      {
        name: productData.name,
        code: productData.code,
        description: productData.description ?? undefined,
        status: ProductStatus.create(productData.status) ?? defaultStatus,
        unitOfMeasure:
          UnitOfMeasure.create(productData.unitOfMeasure) ??
          defaultUnitOfMeasure,
        attributes: productData.attributes as Record<string, unknown>,
        templateId: new EntityID(productData.templateId), // Sempre presente
        supplierId: productData.supplierId
          ? new EntityID(productData.supplierId)
          : undefined,
        manufacturerId: productData.manufacturerId
          ? new EntityID(productData.manufacturerId)
          : undefined,
        createdAt: productData.createdAt,
        updatedAt: productData.updatedAt ?? undefined,
      },
      new EntityID(productData.id),
    );
  }

  async findById(id: UniqueEntityID): Promise<Product | null> {
    const productData = await prisma.product.findUnique({
      where: {
        id: id.toString(),
        deletedAt: null,
      },
    });

    if (!productData) {
      return null;
    }

    const defaultStatus = ProductStatus.create('DRAFT');
    const defaultUnitOfMeasure = UnitOfMeasure.create('UNITS');

    return Product.create(
      {
        name: productData.name,
        code: productData.code,
        description: productData.description ?? undefined,
        status: ProductStatus.create(productData.status) ?? defaultStatus,
        unitOfMeasure:
          UnitOfMeasure.create(productData.unitOfMeasure) ??
          defaultUnitOfMeasure,
        attributes: productData.attributes as Record<string, unknown>,
        templateId: new EntityID(productData.templateId),
        supplierId: productData.supplierId
          ? new EntityID(productData.supplierId)
          : undefined,
        manufacturerId: productData.manufacturerId
          ? new EntityID(productData.manufacturerId)
          : undefined,
        createdAt: productData.createdAt,
        updatedAt: productData.updatedAt ?? undefined,
      },
      new EntityID(productData.id),
    );
  }

  async findByName(name: string): Promise<Product | null> {
    const productData = await prisma.product.findFirst({
      where: {
        name: {
          contains: name,
          mode: 'insensitive',
        },
        deletedAt: null,
      },
    });

    if (!productData) {
      return null;
    }

    const defaultStatus = ProductStatus.create('DRAFT');
    const defaultUnitOfMeasure = UnitOfMeasure.create('UNITS');

    return Product.create(
      {
        name: productData.name,
        code: productData.code,
        description: productData.description ?? undefined,
        status: ProductStatus.create(productData.status) ?? defaultStatus,
        unitOfMeasure:
          UnitOfMeasure.create(productData.unitOfMeasure) ??
          defaultUnitOfMeasure,
        attributes: productData.attributes as Record<string, unknown>,
        templateId: new EntityID(productData.templateId),
        supplierId: productData.supplierId
          ? new EntityID(productData.supplierId)
          : undefined,
        manufacturerId: productData.manufacturerId
          ? new EntityID(productData.manufacturerId)
          : undefined,
        createdAt: productData.createdAt,
        updatedAt: productData.updatedAt ?? undefined,
      },
      new EntityID(productData.id),
    );
  }

  async findMany(): Promise<Product[]> {
    const products = await prisma.product.findMany({
      where: {
        deletedAt: null,
      },
    });

    const defaultStatus = ProductStatus.create('DRAFT');
    const defaultUnitOfMeasure = UnitOfMeasure.create('UNITS');

    return products.map((productData) =>
      Product.create(
        {
          name: productData.name,
          code: productData.code,
          description: productData.description ?? undefined,
          status: ProductStatus.create(productData.status) ?? defaultStatus,
          unitOfMeasure:
            UnitOfMeasure.create(productData.unitOfMeasure) ??
            defaultUnitOfMeasure,
          attributes: productData.attributes as Record<string, unknown>,
          templateId: new EntityID(productData.templateId),
          supplierId: productData.supplierId
            ? new EntityID(productData.supplierId)
            : undefined,
          manufacturerId: productData.manufacturerId
            ? new EntityID(productData.manufacturerId)
            : undefined,
          createdAt: productData.createdAt,
          updatedAt: productData.updatedAt ?? undefined,
        },
        new EntityID(productData.id),
      ),
    );
  }

  async findManyByStatus(status: ProductStatus): Promise<Product[]> {
    const products = await prisma.product.findMany({
      where: {
        status: status.value as PrismaProductStatus,
        deletedAt: null,
      },
    });

    const defaultStatus = ProductStatus.create('DRAFT');
    const defaultUnitOfMeasure = UnitOfMeasure.create('UNITS');

    return products.map((productData) =>
      Product.create(
        {
          name: productData.name,
          code: productData.code,
          description: productData.description ?? undefined,
          status: ProductStatus.create(productData.status) ?? defaultStatus,
          unitOfMeasure:
            UnitOfMeasure.create(productData.unitOfMeasure) ??
            defaultUnitOfMeasure,
          attributes: productData.attributes as Record<string, unknown>,
          templateId: new EntityID(productData.templateId),
          supplierId: productData.supplierId
            ? new EntityID(productData.supplierId)
            : undefined,
          manufacturerId: productData.manufacturerId
            ? new EntityID(productData.manufacturerId)
            : undefined,
          createdAt: productData.createdAt,
          updatedAt: productData.updatedAt ?? undefined,
        },
        new EntityID(productData.id),
      ),
    );
  }

  async findManyByTemplate(templateId: UniqueEntityID): Promise<Product[]> {
    const products = await prisma.product.findMany({
      where: {
        templateId: templateId.toString(),
        deletedAt: null,
      },
    });

    const defaultStatus = ProductStatus.create('DRAFT');
    const defaultUnitOfMeasure = UnitOfMeasure.create('UNITS');

    return products.map((productData) =>
      Product.create(
        {
          name: productData.name,
          code: productData.code,
          description: productData.description ?? undefined,
          status: ProductStatus.create(productData.status) ?? defaultStatus,
          unitOfMeasure:
            UnitOfMeasure.create(productData.unitOfMeasure) ??
            defaultUnitOfMeasure,
          attributes: productData.attributes as Record<string, unknown>,
          templateId: new EntityID(productData.templateId),
          supplierId: productData.supplierId
            ? new EntityID(productData.supplierId)
            : undefined,
          manufacturerId: productData.manufacturerId
            ? new EntityID(productData.manufacturerId)
            : undefined,
          createdAt: productData.createdAt,
          updatedAt: productData.updatedAt ?? undefined,
        },
        new EntityID(productData.id),
      ),
    );
  }

  async findManyByManufacturer(
    manufacturerId: UniqueEntityID,
  ): Promise<Product[]> {
    const products = await prisma.product.findMany({
      where: {
        manufacturerId: manufacturerId.toString(),
        deletedAt: null,
      },
    });

    const defaultStatus = ProductStatus.create('DRAFT');
    const defaultUnitOfMeasure = UnitOfMeasure.create('UNITS');

    return products.map((productData) =>
      Product.create(
        {
          name: productData.name,
          code: productData.code,
          description: productData.description ?? undefined,
          status: ProductStatus.create(productData.status) ?? defaultStatus,
          unitOfMeasure:
            UnitOfMeasure.create(productData.unitOfMeasure) ??
            defaultUnitOfMeasure,
          attributes: productData.attributes as Record<string, unknown>,
          templateId: new EntityID(productData.templateId),
          supplierId: productData.supplierId
            ? new EntityID(productData.supplierId)
            : undefined,
          manufacturerId: productData.manufacturerId
            ? new EntityID(productData.manufacturerId)
            : undefined,
          createdAt: productData.createdAt,
          updatedAt: productData.updatedAt ?? undefined,
        },
        new EntityID(productData.id),
      ),
    );
  }

  async findManyByCategory(categoryId: UniqueEntityID): Promise<Product[]> {
    const products = await prisma.product.findMany({
      where: {
        productCategories: {
          some: {
            categoryId: categoryId.toString(),
          },
        },
        deletedAt: null,
      },
    });

    const defaultStatus = ProductStatus.create('DRAFT');
    const defaultUnitOfMeasure = UnitOfMeasure.create('UNITS');

    return products.map((productData) =>
      Product.create(
        {
          name: productData.name,
          code: productData.code,
          description: productData.description ?? undefined,
          status: ProductStatus.create(productData.status) ?? defaultStatus,
          unitOfMeasure:
            UnitOfMeasure.create(productData.unitOfMeasure) ??
            defaultUnitOfMeasure,
          attributes: productData.attributes as Record<string, unknown>,
          templateId: new EntityID(productData.templateId),
          supplierId: productData.supplierId
            ? new EntityID(productData.supplierId)
            : undefined,
          manufacturerId: productData.manufacturerId
            ? new EntityID(productData.manufacturerId)
            : undefined,
          createdAt: productData.createdAt,
          updatedAt: productData.updatedAt ?? undefined,
        },
        new EntityID(productData.id),
      ),
    );
  }

  async update(data: UpdateProductSchema): Promise<Product | null> {
    const productData = await prisma.product.update({
      where: {
        id: data.id.toString(),
      },
      data: {
        name: data.name,
        code: data.code,
        description: data.description,
        status: data.status?.value as PrismaProductStatus | undefined,
        unitOfMeasure: data.unitOfMeasure?.value as
          | PrismaUnitOfMeasure
          | undefined,
        attributes: data.attributes as never,
        // templateId não pode ser alterado (readonly)
        supplierId: data.supplierId?.toString(),
        manufacturerId: data.manufacturerId?.toString(),
      },
    });

    const defaultStatus = ProductStatus.create('DRAFT');
    const defaultUnitOfMeasure = UnitOfMeasure.create('UNITS');

    return Product.create(
      {
        name: productData.name,
        code: productData.code,
        description: productData.description ?? undefined,
        status: ProductStatus.create(productData.status) ?? defaultStatus,
        unitOfMeasure:
          UnitOfMeasure.create(productData.unitOfMeasure) ??
          defaultUnitOfMeasure,
        attributes: productData.attributes as Record<string, unknown>,
        templateId: new EntityID(productData.templateId), // Sempre presente
        supplierId: productData.supplierId
          ? new EntityID(productData.supplierId)
          : undefined,
        manufacturerId: productData.manufacturerId
          ? new EntityID(productData.manufacturerId)
          : undefined,
        createdAt: productData.createdAt,
        updatedAt: productData.updatedAt ?? undefined,
      },
      new EntityID(productData.id),
    );
  }

  async save(product: Product): Promise<void> {
    await prisma.product.update({
      where: {
        id: product.id.toString(),
      },
      data: {
        name: product.name,
        code: product.code,
        description: product.description,
        status: product.status.value as PrismaProductStatus,
        unitOfMeasure: product.unitOfMeasure.value as PrismaUnitOfMeasure,
        attributes: product.attributes as never,
        templateId: product.templateId.toString(),
        supplierId: product.supplierId?.toString(),
        manufacturerId: product.manufacturerId?.toString(),
        updatedAt: new Date(),
      },
    });
  }

  async delete(id: UniqueEntityID): Promise<void> {
    await prisma.product.update({
      where: {
        id: id.toString(),
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}
