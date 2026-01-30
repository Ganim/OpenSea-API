import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import { Product } from '@/entities/stock/product';
import { CareInstructions } from '@/entities/stock/value-objects/care-instructions';
import { ProductStatus } from '@/entities/stock/value-objects/product-status';
import { prisma } from '@/lib/prisma';
import { productPrismaToDomain } from '@/mappers/stock/product/product-prisma-to-domain';
import type { ProductStatus as PrismaProductStatus } from '@prisma/generated/client';
import type {
    CreateProductSchema,
    ProductsRepository,
    UpdateProductSchema,
} from '../products-repository';

const productInclude = {
  template: true,
  supplier: true,
  manufacturer: true,
  organization: true,
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
    const productData = await prisma.product.create({
      data: {
        name: data.name,
        slug: data.slug.value,
        fullCode: data.fullCode,
        barcode: data.barcode,
        eanCode: data.eanCode,
        upcCode: data.upcCode,
        code: data.code,
        description: data.description,
        status: (data.status?.value ?? 'ACTIVE') as PrismaProductStatus,
        outOfLine: data.outOfLine ?? false,
        attributes: (data.attributes ?? {}) as never,
        templateId: data.templateId.toString(),
        supplierId: data.supplierId?.toString(),
        manufacturerId: data.manufacturerId?.toString(),
      },
    });

    const defaultStatus = ProductStatus.create('ACTIVE');

    const createdProduct = Product.create(
      {
        name: productData.name,
        slug: data.slug, // Usar o slug original que foi passado
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

    return createdProduct;
  }

  async findById(id: UniqueEntityID): Promise<Product | null> {
    const productData = await prisma.product.findUnique({
      where: {
        id: id.toString(),
        deletedAt: null,
      },
      include: {
        template: true,
        supplier: true,
        manufacturer: true,
        organization: true,
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

  async findByName(name: string): Promise<Product | null> {
    const productData = await prisma.product.findFirst({
      where: {
        name: {
          contains: name,
          mode: 'insensitive',
        },
        deletedAt: null,
      },
      include: productInclude,
    });

    if (!productData) {
      return null;
    }

    return productPrismaToDomain(productData);
  }

  async findMany(): Promise<Product[]> {
    const products = await prisma.product.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        template: true,
        supplier: true,
        manufacturer: true,
        organization: true,
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

    return products.map(productPrismaToDomain);
  }

  async findManyByStatus(status: ProductStatus): Promise<Product[]> {
    const products = await prisma.product.findMany({
      where: {
        status: status.value as PrismaProductStatus,
        deletedAt: null,
      },
      include: productInclude,
    });

    return products.map(productPrismaToDomain);
  }

  async findManyByTemplate(templateId: UniqueEntityID): Promise<Product[]> {
    const products = await prisma.product.findMany({
      where: {
        templateId: templateId.toString(),
        deletedAt: null,
      },
      include: productInclude,
    });

    return products.map(productPrismaToDomain);
  }

  async findManyByManufacturer(
    manufacturerId: UniqueEntityID,
  ): Promise<Product[]> {
    const products = await prisma.product.findMany({
      where: {
        manufacturerId: manufacturerId.toString(),
        deletedAt: null,
      },
      include: productInclude,
    });

    return products.map(productPrismaToDomain);
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
      include: productInclude,
    });

    return products.map(productPrismaToDomain);
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
            attributes: data.attributes as never,
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
        attributes: data.attributes as never,
        supplierId: data.supplierId?.toString(),
        manufacturerId: data.manufacturerId?.toString(),
      },
      include: productInclude,
    });

    return productPrismaToDomain(productData);
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
        outOfLine: productData.outOfLine ?? false,
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
        outOfLine: product.outOfLine,
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

  async getNextSequentialCode(): Promise<number> {
    const result = await prisma.$queryRaw<[{ nextval: bigint }]>`
      SELECT nextval(pg_get_serial_sequence('products', 'sequential_code'))
    `;
    return Number(result[0].nextval);
  }
}
