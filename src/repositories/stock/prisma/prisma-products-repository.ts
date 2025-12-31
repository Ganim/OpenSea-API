import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import { Product } from '@/entities/stock/product';
import { CareInstructions } from '@/entities/stock/value-objects/care-instructions';
import { ProductStatus } from '@/entities/stock/value-objects/product-status';
import { prisma } from '@/lib/prisma';
import type { ProductStatus as PrismaProductStatus } from '@prisma/client';
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
        status: (data.status?.value ?? 'ACTIVE') as PrismaProductStatus,
        attributes: (data.attributes ?? {}) as never,
        templateId: data.templateId.toString(),
        supplierId: data.supplierId?.toString(),
        manufacturerId: data.manufacturerId?.toString(),
      },
    });

    const defaultStatus = ProductStatus.create('ACTIVE');

    return Product.create(
      {
        name: productData.name,
        code: productData.code ?? undefined,
        fullCode: productData.fullCode ?? undefined,
        sequentialCode: productData.sequentialCode ?? undefined,
        description: productData.description ?? undefined,
        status: ProductStatus.create(productData.status) ?? defaultStatus,
        attributes: productData.attributes as Record<string, unknown>,
        careInstructions: CareInstructions.create(
          productData.careInstructionIds ?? [],
        ),
        templateId: new EntityID(productData.templateId),
        supplierId: productData.supplierId
          ? new EntityID(productData.supplierId)
          : undefined,
        manufacturerId: productData.manufacturerId
          ? new EntityID(productData.manufacturerId)
          : undefined,
        createdAt: productData.createdAt,
        updatedAt: productData.updatedAt ?? undefined,
        deletedAt: productData.deletedAt ?? undefined,
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

    const defaultStatus = ProductStatus.create('ACTIVE');

    return Product.create(
      {
        name: productData.name,
        code: productData.code ?? undefined,
        fullCode: productData.fullCode ?? undefined,
        sequentialCode: productData.sequentialCode ?? undefined,
        description: productData.description ?? undefined,
        status: ProductStatus.create(productData.status) ?? defaultStatus,
        attributes: productData.attributes as Record<string, unknown>,
        careInstructions: CareInstructions.create(
          productData.careInstructionIds ?? [],
        ),
        templateId: new EntityID(productData.templateId),
        supplierId: productData.supplierId
          ? new EntityID(productData.supplierId)
          : undefined,
        manufacturerId: productData.manufacturerId
          ? new EntityID(productData.manufacturerId)
          : undefined,
        createdAt: productData.createdAt,
        updatedAt: productData.updatedAt ?? undefined,
        deletedAt: productData.deletedAt ?? undefined,
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

    const defaultStatus = ProductStatus.create('ACTIVE');

    return Product.create(
      {
        name: productData.name,
        code: productData.code ?? undefined,
        fullCode: productData.fullCode ?? undefined,
        sequentialCode: productData.sequentialCode ?? undefined,
        description: productData.description ?? undefined,
        status: ProductStatus.create(productData.status) ?? defaultStatus,
        attributes: productData.attributes as Record<string, unknown>,
        careInstructions: CareInstructions.create(
          productData.careInstructionIds ?? [],
        ),
        templateId: new EntityID(productData.templateId),
        supplierId: productData.supplierId
          ? new EntityID(productData.supplierId)
          : undefined,
        manufacturerId: productData.manufacturerId
          ? new EntityID(productData.manufacturerId)
          : undefined,
        createdAt: productData.createdAt,
        updatedAt: productData.updatedAt ?? undefined,
        deletedAt: productData.deletedAt ?? undefined,
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

    const defaultStatus = ProductStatus.create('ACTIVE');

    return products.map((productData) =>
      Product.create(
        {
          name: productData.name,
          code: productData.code ?? undefined,
          fullCode: productData.fullCode ?? undefined,
          sequentialCode: productData.sequentialCode ?? undefined,
          description: productData.description ?? undefined,
          status: ProductStatus.create(productData.status) ?? defaultStatus,
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
          deletedAt: productData.deletedAt ?? undefined,
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

    const defaultStatus = ProductStatus.create('ACTIVE');

    return products.map((productData) =>
      Product.create(
        {
          name: productData.name,
          code: productData.code ?? undefined,
          fullCode: productData.fullCode ?? undefined,
          sequentialCode: productData.sequentialCode ?? undefined,
          description: productData.description ?? undefined,
          status: ProductStatus.create(productData.status) ?? defaultStatus,
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
          deletedAt: productData.deletedAt ?? undefined,
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

    const defaultStatus = ProductStatus.create('ACTIVE');

    return products.map((productData) =>
      Product.create(
        {
          name: productData.name,
          code: productData.code ?? undefined,
          fullCode: productData.fullCode ?? undefined,
          sequentialCode: productData.sequentialCode ?? undefined,
          description: productData.description ?? undefined,
          status: ProductStatus.create(productData.status) ?? defaultStatus,
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
          deletedAt: productData.deletedAt ?? undefined,
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

    const defaultStatus = ProductStatus.create('ACTIVE');

    return products.map((productData) =>
      Product.create(
        {
          name: productData.name,
          code: productData.code ?? undefined,
          fullCode: productData.fullCode ?? undefined,
          sequentialCode: productData.sequentialCode ?? undefined,
          description: productData.description ?? undefined,
          status: ProductStatus.create(productData.status) ?? defaultStatus,
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
          deletedAt: productData.deletedAt ?? undefined,
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

    const defaultStatus = ProductStatus.create('ACTIVE');

    return products.map((productData) =>
      Product.create(
        {
          name: productData.name,
          code: productData.code ?? undefined,
          fullCode: productData.fullCode ?? undefined,
          sequentialCode: productData.sequentialCode ?? undefined,
          description: productData.description ?? undefined,
          status: ProductStatus.create(productData.status) ?? defaultStatus,
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
          deletedAt: productData.deletedAt ?? undefined,
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
        attributes: data.attributes as never,
        supplierId: data.supplierId?.toString(),
        manufacturerId: data.manufacturerId?.toString(),
      },
    });

    const defaultStatus = ProductStatus.create('ACTIVE');

    return Product.create(
      {
        name: productData.name,
        code: productData.code ?? undefined,
        fullCode: productData.fullCode ?? undefined,
        sequentialCode: productData.sequentialCode ?? undefined,
        description: productData.description ?? undefined,
        status: ProductStatus.create(productData.status) ?? defaultStatus,
        attributes: productData.attributes as Record<string, unknown>,
        careInstructions: CareInstructions.create(
          productData.careInstructionIds ?? [],
        ),
        templateId: new EntityID(productData.templateId),
        supplierId: productData.supplierId
          ? new EntityID(productData.supplierId)
          : undefined,
        manufacturerId: productData.manufacturerId
          ? new EntityID(productData.manufacturerId)
          : undefined,
        createdAt: productData.createdAt,
        updatedAt: productData.updatedAt ?? undefined,
        deletedAt: productData.deletedAt ?? undefined,
      },
      new EntityID(productData.id),
    );
  }

  async updateCareInstructions(
    productId: UniqueEntityID,
    careInstructionIds: string[],
  ): Promise<Product> {
    const existingProduct = await prisma.product.findUnique({
      where: {
        id: productId.toString(),
        deletedAt: null,
      },
    });

    if (!existingProduct) {
      throw new ResourceNotFoundError('Product not found');
    }

    const productData = await prisma.product.update({
      where: {
        id: productId.toString(),
      },
      data: {
        careInstructionIds,
        updatedAt: new Date(),
      },
    });

    const defaultStatus = ProductStatus.create('ACTIVE');

    return Product.create(
      {
        name: productData.name,
        code: productData.code ?? undefined,
        fullCode: productData.fullCode ?? undefined,
        sequentialCode: productData.sequentialCode ?? undefined,
        description: productData.description ?? undefined,
        status: ProductStatus.create(productData.status) ?? defaultStatus,
        attributes: productData.attributes as Record<string, unknown>,
        careInstructions: CareInstructions.create(
          productData.careInstructionIds ?? [],
        ),
        templateId: new EntityID(productData.templateId),
        supplierId: productData.supplierId
          ? new EntityID(productData.supplierId)
          : undefined,
        manufacturerId: productData.manufacturerId
          ? new EntityID(productData.manufacturerId)
          : undefined,
        createdAt: productData.createdAt,
        updatedAt: productData.updatedAt ?? undefined,
        deletedAt: productData.deletedAt ?? undefined,
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
        attributes: product.attributes as never,
        careInstructionIds: product.careInstructionIds,
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
