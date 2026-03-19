import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import { Product } from '@/entities/stock/product';
import { ProductStatus } from '@/entities/stock/value-objects/product-status';
import { prisma } from '@/lib/prisma';
import { productPrismaToDomain } from '@/mappers/stock/product/product-prisma-to-domain';
import type {
  Prisma,
  ProductStatus as PrismaProductStatus,
} from '@prisma/generated/client';
import type {
  PaginatedResult,
  PaginationParams,
} from '../../pagination-params';
import type {
  CreateProductSchema,
  ProductsRepository,
  UpdateProductSchema,
} from '../products-repository';

const productInclude = {
  template: true,
  supplier: true,
  manufacturer: true,
  variants: {
    where: { deletedAt: null },
  },
  productCategories: {
    include: { category: true },
    where: { category: { deletedAt: null } },
  },
  productTags: {
    include: { tag: true },
    where: { tag: { deletedAt: null } },
  },
} as const;

export class PrismaProductsRepository implements ProductsRepository {
  async create(data: CreateProductSchema): Promise<Product> {
    const hasCategoryIds =
      data.categoryIds !== undefined && data.categoryIds.length > 0;

    const productCreateData = {
      tenantId: data.tenantId,
      name: data.name,
      slug: data.slug.value,
      fullCode: data.fullCode,
      barcode: data.barcode,
      eanCode: data.eanCode,
      upcCode: data.upcCode,
      description: data.description,
      status: (data.status?.value ?? 'ACTIVE') as PrismaProductStatus,
      outOfLine: data.outOfLine ?? false,
      attributes: (data.attributes ?? {}) as Prisma.InputJsonValue,
      templateId: data.templateId.toString(),
      supplierId: data.supplierId?.toString(),
      manufacturerId: data.manufacturerId?.toString(),
    };

    let productData;

    if (hasCategoryIds) {
      productData = await prisma.$transaction(async (tx) => {
        const created = await tx.product.create({ data: productCreateData });

        await tx.productCategory.createMany({
          data: data.categoryIds!.map((categoryId, index) => ({
            productId: created.id,
            categoryId,
            order: index,
          })),
        });

        return tx.product.findUniqueOrThrow({
          where: { id: created.id },
          include: productInclude,
        });
      });

      return productPrismaToDomain(productData);
    }

    productData = await prisma.product.create({
      data: productCreateData,
    });

    const defaultStatus = ProductStatus.create('ACTIVE');

    const createdProduct = Product.create(
      {
        tenantId: new EntityID(productData.tenantId),
        name: productData.name,
        slug: data.slug,
        fullCode: productData.fullCode ?? undefined,
        barcode: productData.barcode,
        eanCode: productData.eanCode,
        upcCode: productData.upcCode,
        qrCode: productData.qrCode ?? undefined,
        sequentialCode: productData.sequentialCode ?? undefined,
        description: productData.description ?? undefined,
        status: ProductStatus.create(productData.status) ?? defaultStatus,
        outOfLine: productData.outOfLine ?? false,
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
    );

    return createdProduct;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<Product | null> {
    const productData = await prisma.product.findUnique({
      where: {
        id: id.toString(),
        tenantId,
        deletedAt: null,
      },
      include: {
        template: true,
        supplier: true,
        manufacturer: true,
        variants: {
          where: { deletedAt: null },
        },
        productCategories: {
          include: { category: true },
          where: { category: { deletedAt: null } },
        },
        productTags: {
          include: { tag: true },
          where: { tag: { deletedAt: null } },
        },
      },
    });

    if (!productData) {
      return null;
    }

    return productPrismaToDomain(productData);
  }

  async findByName(name: string, tenantId: string): Promise<Product | null> {
    const productData = await prisma.product.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive',
        },
        tenantId,
        deletedAt: null,
      },
      include: productInclude,
    });

    if (!productData) {
      return null;
    }

    return productPrismaToDomain(productData);
  }

  async findManyByNames(
    names: string[],
    tenantId: string,
  ): Promise<Product[]> {
    if (names.length === 0) return [];

    const products = await prisma.product.findMany({
      where: {
        tenantId,
        deletedAt: null,
        OR: names.map((name) => ({
          name: { equals: name, mode: 'insensitive' as const },
        })),
      },
      include: productInclude,
    });

    return products.map(productPrismaToDomain);
  }

  async findMany(tenantId: string): Promise<Product[]> {
    const products = await prisma.product.findMany({
      where: {
        tenantId,
        deletedAt: null,
      },
      include: productInclude,
    });

    return products.map(productPrismaToDomain);
  }

  async findManyPaginated(
    tenantId: string,
    params: PaginationParams & {
      search?: string;
      sortBy?: 'name' | 'createdAt' | 'updatedAt';
      sortOrder?: 'asc' | 'desc';
      templateIds?: string[];
      manufacturerIds?: string[];
      categoryIds?: string[];
    },
  ): Promise<PaginatedResult<Product>> {
    const where: Prisma.ProductWhereInput = {
      tenantId,
      deletedAt: null,
      ...(params.search && {
        name: { contains: params.search, mode: 'insensitive' as const },
      }),
      ...(params.templateIds &&
        params.templateIds.length > 0 && {
          templateId: { in: params.templateIds },
        }),
      ...(params.manufacturerIds &&
        params.manufacturerIds.length > 0 && {
          manufacturerId: { in: params.manufacturerIds },
        }),
      ...(params.categoryIds &&
        params.categoryIds.length > 0 && {
          productCategories: {
            some: { categoryId: { in: params.categoryIds } },
          },
        }),
    };
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: productInclude,
        orderBy: {
          [params.sortBy ?? 'createdAt']: params.sortOrder ?? 'desc',
        },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.product.count({ where }),
    ]);

    return {
      data: products.map(productPrismaToDomain),
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    };
  }

  async findManyByStatus(
    status: ProductStatus,
    tenantId: string,
  ): Promise<Product[]> {
    const products = await prisma.product.findMany({
      where: {
        status: status.value as PrismaProductStatus,
        tenantId,
        deletedAt: null,
      },
      include: productInclude,
    });

    return products.map(productPrismaToDomain);
  }

  async findManyByStatusPaginated(
    status: ProductStatus,
    tenantId: string,
    params: PaginationParams,
  ): Promise<PaginatedResult<Product>> {
    const where = {
      status: status.value as PrismaProductStatus,
      tenantId,
      deletedAt: null,
    };
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: productInclude,
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.product.count({ where }),
    ]);

    return {
      data: products.map(productPrismaToDomain),
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    };
  }

  async findManyByTemplate(
    templateId: UniqueEntityID,
    tenantId: string,
  ): Promise<Product[]> {
    const products = await prisma.product.findMany({
      where: {
        templateId: templateId.toString(),
        tenantId,
        deletedAt: null,
      },
      include: productInclude,
    });

    return products.map(productPrismaToDomain);
  }

  async findManyByTemplatePaginated(
    templateId: UniqueEntityID,
    tenantId: string,
    params: PaginationParams,
  ): Promise<PaginatedResult<Product>> {
    const where = {
      templateId: templateId.toString(),
      tenantId,
      deletedAt: null,
    };
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: productInclude,
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.product.count({ where }),
    ]);

    return {
      data: products.map(productPrismaToDomain),
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    };
  }

  async findManyByManufacturer(
    manufacturerId: UniqueEntityID,
    tenantId: string,
  ): Promise<Product[]> {
    const products = await prisma.product.findMany({
      where: {
        manufacturerId: manufacturerId.toString(),
        tenantId,
        deletedAt: null,
      },
      include: productInclude,
    });

    return products.map(productPrismaToDomain);
  }

  async findManyByManufacturerPaginated(
    manufacturerId: UniqueEntityID,
    tenantId: string,
    params: PaginationParams,
  ): Promise<PaginatedResult<Product>> {
    const where = {
      manufacturerId: manufacturerId.toString(),
      tenantId,
      deletedAt: null,
    };
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: productInclude,
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.product.count({ where }),
    ]);

    return {
      data: products.map(productPrismaToDomain),
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    };
  }

  async findManyByCategory(
    categoryId: UniqueEntityID,
    tenantId: string,
  ): Promise<Product[]> {
    const products = await prisma.product.findMany({
      where: {
        productCategories: {
          some: { categoryId: categoryId.toString() },
        },
        tenantId,
        deletedAt: null,
      },
      include: productInclude,
    });

    return products.map(productPrismaToDomain);
  }

  async findManyByCategoryPaginated(
    categoryId: UniqueEntityID,
    tenantId: string,
    params: PaginationParams,
  ): Promise<PaginatedResult<Product>> {
    const where = {
      productCategories: {
        some: { categoryId: categoryId.toString() },
      },
      tenantId,
      deletedAt: null,
    };
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: productInclude,
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.product.count({ where }),
    ]);

    return {
      data: products.map(productPrismaToDomain),
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    };
  }

  async update(data: UpdateProductSchema): Promise<Product | null> {
    const productId = data.id.toString();

    // Se categoryIds foi fornecido, usar transação para atualizar produto e categorias
    if (data.categoryIds !== undefined) {
      const productData = await prisma.$transaction(async (tx) => {
        // Atualizar dados do produto
        await tx.product.update({
          where: { id: productId },
          data: {
            name: data.name,
            description: data.description,
            status: data.status?.value as PrismaProductStatus | undefined,
            outOfLine: data.outOfLine,
            attributes: data.attributes as Prisma.InputJsonValue,
            supplierId: data.supplierId?.toString(),
            manufacturerId: data.manufacturerId?.toString(),
          },
        });

        // Remover todas as categorias existentes
        await tx.productCategory.deleteMany({
          where: { productId },
        });

        // Recriar com as novas categorias
        if (data.categoryIds!.length > 0) {
          await tx.productCategory.createMany({
            data: data.categoryIds!.map((categoryId, index) => ({
              productId,
              categoryId,
              order: index,
            })),
          });
        }

        // Re-fetch com includes para retornar dados atualizados
        return tx.product.findUniqueOrThrow({
          where: { id: productId },
          include: productInclude,
        });
      });

      return productPrismaToDomain(productData);
    }

    const productData = await prisma.product.update({
      where: { id: productId },
      data: {
        name: data.name,
        // code e fullCode são imutáveis após criação
        description: data.description,
        status: data.status?.value as PrismaProductStatus | undefined,
        outOfLine: data.outOfLine,
        attributes: data.attributes as Prisma.InputJsonValue,
        supplierId: data.supplierId?.toString(),
        manufacturerId: data.manufacturerId?.toString(),
      },
      include: productInclude,
    });

    return productPrismaToDomain(productData);
  }

  async save(product: Product): Promise<void> {
    await prisma.product.update({
      where: {
        id: product.id.toString(),
      },
      data: {
        name: product.name,
        description: product.description,
        status: product.status.value as PrismaProductStatus,
        outOfLine: product.outOfLine,
        attributes: product.attributes as Prisma.InputJsonValue,
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

  async getNextSequentialCode(): Promise<number> {
    const result = await prisma.$queryRaw<[{ nextval: bigint }]>`
      SELECT nextval(pg_get_serial_sequence('products', 'sequential_code'))
    `;
    return Number(result[0].nextval);
  }
}
