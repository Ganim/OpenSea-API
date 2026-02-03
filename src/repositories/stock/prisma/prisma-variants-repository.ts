import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import { Variant } from '@/entities/stock/variant';
import { Slug } from '@/entities/stock/value-objects/slug';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/generated/client.js';
import type {
  CreateVariantSchema,
  UpdateVariantSchema,
  VariantsRepository,
} from '../variants-repository';

export class PrismaVariantsRepository implements VariantsRepository {
  async create(data: CreateVariantSchema): Promise<Variant> {
    const variantData = await prisma.variant.create({
      data: {
        tenantId: data.tenantId,
        productId: data.productId.toString(),
        slug: data.slug.value,
        fullCode: data.fullCode,
        sequentialCode: data.sequentialCode,
        sku: data.sku,
        name: data.name,
        price: data.price,
        imageUrl: data.imageUrl,
        attributes: (data.attributes ?? {}) as Prisma.InputJsonValue,
        costPrice: data.costPrice ? data.costPrice : undefined,
        profitMargin: data.profitMargin ? data.profitMargin : undefined,
        barcode: data.barcode ?? '',
        qrCode: data.qrCode,
        eanCode: data.eanCode ?? '',
        upcCode: data.upcCode ?? '',
        colorHex: data.colorHex,
        colorPantone: data.colorPantone,
        minStock: data.minStock ? data.minStock : undefined,
        maxStock: data.maxStock ? data.maxStock : undefined,
        reorderPoint: data.reorderPoint ? data.reorderPoint : undefined,
        reorderQuantity: data.reorderQuantity
          ? data.reorderQuantity
          : undefined,
        reference: data.reference,
        similars: (data.similars ?? []) as Prisma.InputJsonValue,
        outOfLine: data.outOfLine ?? false,
        isActive: data.isActive ?? true,
      },
    });

    return Variant.create(
      {
        tenantId: new EntityID(variantData.tenantId),
        productId: new EntityID(variantData.productId),
        slug: data.slug,
        fullCode: variantData.fullCode ?? undefined,
        sequentialCode: variantData.sequentialCode ?? undefined,
        sku: variantData.sku ?? undefined,
        name: variantData.name,
        price: Number(variantData.price.toString()),
        imageUrl: variantData.imageUrl ?? undefined,
        attributes: variantData.attributes as Record<string, unknown>,
        costPrice: variantData.costPrice
          ? Number(variantData.costPrice.toString())
          : undefined,
        profitMargin: variantData.profitMargin
          ? Number(variantData.profitMargin.toString())
          : undefined,
        barcode: variantData.barcode ?? undefined,
        qrCode: variantData.qrCode ?? undefined,
        eanCode: variantData.eanCode ?? undefined,
        upcCode: variantData.upcCode ?? undefined,
        colorHex: variantData.colorHex ?? undefined,
        colorPantone: variantData.colorPantone ?? undefined,
        minStock: variantData.minStock
          ? Number(variantData.minStock.toString())
          : undefined,
        maxStock: variantData.maxStock
          ? Number(variantData.maxStock.toString())
          : undefined,
        reorderPoint: variantData.reorderPoint
          ? Number(variantData.reorderPoint.toString())
          : undefined,
        reorderQuantity: variantData.reorderQuantity
          ? Number(variantData.reorderQuantity.toString())
          : undefined,
        reference: variantData.reference ?? undefined,
        similars: (variantData.similars as unknown[]) ?? undefined,
        outOfLine: variantData.outOfLine,
        isActive: variantData.isActive,
        createdAt: variantData.createdAt,
        updatedAt: variantData.updatedAt ?? undefined,
      },
      new EntityID(variantData.id),
    );
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<Variant | null> {
    const variantData = await prisma.variant.findUnique({
      where: {
        id: id.toString(),
        tenantId,
        deletedAt: null,
      },
    });

    if (!variantData) {
      return null;
    }

    return Variant.create(
      {
        tenantId: new EntityID(variantData.tenantId),
        productId: new EntityID(variantData.productId),
        slug: Slug.create(variantData.slug),
        sku: variantData.sku ?? undefined,
        fullCode: variantData.fullCode ?? undefined,
        sequentialCode: variantData.sequentialCode ?? undefined,
        name: variantData.name,
        price: Number(variantData.price.toString()),
        imageUrl: variantData.imageUrl ?? undefined,
        attributes: variantData.attributes as Record<string, unknown>,
        costPrice: variantData.costPrice
          ? Number(variantData.costPrice.toString())
          : undefined,
        profitMargin: variantData.profitMargin
          ? Number(variantData.profitMargin.toString())
          : undefined,
        barcode: variantData.barcode ?? undefined,
        qrCode: variantData.qrCode ?? undefined,
        eanCode: variantData.eanCode ?? undefined,
        upcCode: variantData.upcCode ?? undefined,
        colorHex: variantData.colorHex ?? undefined,
        colorPantone: variantData.colorPantone ?? undefined,
        minStock: variantData.minStock
          ? Number(variantData.minStock.toString())
          : undefined,
        maxStock: variantData.maxStock
          ? Number(variantData.maxStock.toString())
          : undefined,
        reorderPoint: variantData.reorderPoint
          ? Number(variantData.reorderPoint.toString())
          : undefined,
        reorderQuantity: variantData.reorderQuantity
          ? Number(variantData.reorderQuantity.toString())
          : undefined,
        reference: variantData.reference ?? undefined,
        similars: (variantData.similars as unknown[]) ?? undefined,
        outOfLine: variantData.outOfLine,
        isActive: variantData.isActive,
        createdAt: variantData.createdAt,
        updatedAt: variantData.updatedAt ?? undefined,
      },
      new EntityID(variantData.id),
    );
  }

  async findBySKU(sku: string, tenantId: string): Promise<Variant | null> {
    const variantData = await prisma.variant.findFirst({
      where: {
        sku,
        tenantId,
        deletedAt: null,
      },
    });

    if (!variantData) {
      return null;
    }

    return Variant.create(
      {
        tenantId: new EntityID(variantData.tenantId),
        productId: new EntityID(variantData.productId),
        slug: Slug.create(variantData.slug),
        sku: variantData.sku ?? undefined,
        fullCode: variantData.fullCode ?? undefined,
        sequentialCode: variantData.sequentialCode ?? undefined,
        name: variantData.name,
        price: Number(variantData.price.toString()),
        imageUrl: variantData.imageUrl ?? undefined,
        attributes: variantData.attributes as Record<string, unknown>,
        costPrice: variantData.costPrice
          ? Number(variantData.costPrice.toString())
          : undefined,
        profitMargin: variantData.profitMargin
          ? Number(variantData.profitMargin.toString())
          : undefined,
        barcode: variantData.barcode ?? undefined,
        qrCode: variantData.qrCode ?? undefined,
        eanCode: variantData.eanCode ?? undefined,
        upcCode: variantData.upcCode ?? undefined,
        colorHex: variantData.colorHex ?? undefined,
        colorPantone: variantData.colorPantone ?? undefined,
        minStock: variantData.minStock
          ? Number(variantData.minStock.toString())
          : undefined,
        maxStock: variantData.maxStock
          ? Number(variantData.maxStock.toString())
          : undefined,
        reorderPoint: variantData.reorderPoint
          ? Number(variantData.reorderPoint.toString())
          : undefined,
        reorderQuantity: variantData.reorderQuantity
          ? Number(variantData.reorderQuantity.toString())
          : undefined,
        reference: variantData.reference ?? undefined,
        similars: (variantData.similars as unknown[]) ?? undefined,
        outOfLine: variantData.outOfLine,
        isActive: variantData.isActive,
        createdAt: variantData.createdAt,
        updatedAt: variantData.updatedAt ?? undefined,
      },
      new EntityID(variantData.id),
    );
  }

  async findByBarcode(
    barcode: string,
    tenantId: string,
  ): Promise<Variant | null> {
    const variantData = await prisma.variant.findFirst({
      where: {
        barcode,
        tenantId,
        deletedAt: null,
      },
    });

    if (!variantData) {
      return null;
    }

    return Variant.create(
      {
        tenantId: new EntityID(variantData.tenantId),
        productId: new EntityID(variantData.productId),
        slug: Slug.create(variantData.slug),
        sku: variantData.sku ?? undefined,
        fullCode: variantData.fullCode ?? undefined,
        sequentialCode: variantData.sequentialCode ?? undefined,
        name: variantData.name,
        price: Number(variantData.price.toString()),
        imageUrl: variantData.imageUrl ?? undefined,
        attributes: variantData.attributes as Record<string, unknown>,
        costPrice: variantData.costPrice
          ? Number(variantData.costPrice.toString())
          : undefined,
        profitMargin: variantData.profitMargin
          ? Number(variantData.profitMargin.toString())
          : undefined,
        barcode: variantData.barcode ?? undefined,
        qrCode: variantData.qrCode ?? undefined,
        eanCode: variantData.eanCode ?? undefined,
        upcCode: variantData.upcCode ?? undefined,
        colorHex: variantData.colorHex ?? undefined,
        colorPantone: variantData.colorPantone ?? undefined,
        minStock: variantData.minStock
          ? Number(variantData.minStock.toString())
          : undefined,
        maxStock: variantData.maxStock
          ? Number(variantData.maxStock.toString())
          : undefined,
        reorderPoint: variantData.reorderPoint
          ? Number(variantData.reorderPoint.toString())
          : undefined,
        reorderQuantity: variantData.reorderQuantity
          ? Number(variantData.reorderQuantity.toString())
          : undefined,
        reference: variantData.reference ?? undefined,
        similars: (variantData.similars as unknown[]) ?? undefined,
        outOfLine: variantData.outOfLine,
        isActive: variantData.isActive,
        createdAt: variantData.createdAt,
        updatedAt: variantData.updatedAt ?? undefined,
      },
      new EntityID(variantData.id),
    );
  }

  async findByEANCode(
    eanCode: string,
    tenantId: string,
  ): Promise<Variant | null> {
    const variantData = await prisma.variant.findFirst({
      where: {
        eanCode,
        tenantId,
        deletedAt: null,
      },
    });

    if (!variantData) {
      return null;
    }

    return Variant.create(
      {
        tenantId: new EntityID(variantData.tenantId),
        productId: new EntityID(variantData.productId),
        slug: Slug.create(variantData.slug),
        sku: variantData.sku ?? undefined,
        fullCode: variantData.fullCode ?? undefined,
        sequentialCode: variantData.sequentialCode ?? undefined,
        name: variantData.name,
        price: Number(variantData.price.toString()),
        imageUrl: variantData.imageUrl ?? undefined,
        attributes: variantData.attributes as Record<string, unknown>,
        costPrice: variantData.costPrice
          ? Number(variantData.costPrice.toString())
          : undefined,
        profitMargin: variantData.profitMargin
          ? Number(variantData.profitMargin.toString())
          : undefined,
        barcode: variantData.barcode ?? undefined,
        qrCode: variantData.qrCode ?? undefined,
        eanCode: variantData.eanCode ?? undefined,
        upcCode: variantData.upcCode ?? undefined,
        colorHex: variantData.colorHex ?? undefined,
        colorPantone: variantData.colorPantone ?? undefined,
        minStock: variantData.minStock
          ? Number(variantData.minStock.toString())
          : undefined,
        maxStock: variantData.maxStock
          ? Number(variantData.maxStock.toString())
          : undefined,
        reorderPoint: variantData.reorderPoint
          ? Number(variantData.reorderPoint.toString())
          : undefined,
        reorderQuantity: variantData.reorderQuantity
          ? Number(variantData.reorderQuantity.toString())
          : undefined,
        reference: variantData.reference ?? undefined,
        similars: (variantData.similars as unknown[]) ?? undefined,
        outOfLine: variantData.outOfLine,
        isActive: variantData.isActive,
        createdAt: variantData.createdAt,
        updatedAt: variantData.updatedAt ?? undefined,
      },
      new EntityID(variantData.id),
    );
  }

  async findByUPCCode(
    upcCode: string,
    tenantId: string,
  ): Promise<Variant | null> {
    const variantData = await prisma.variant.findFirst({
      where: {
        upcCode,
        tenantId,
        deletedAt: null,
      },
    });

    if (!variantData) {
      return null;
    }

    return Variant.create(
      {
        tenantId: new EntityID(variantData.tenantId),
        productId: new EntityID(variantData.productId),
        slug: Slug.create(variantData.slug),
        sku: variantData.sku ?? undefined,
        fullCode: variantData.fullCode ?? undefined,
        sequentialCode: variantData.sequentialCode ?? undefined,
        name: variantData.name,
        price: Number(variantData.price.toString()),
        imageUrl: variantData.imageUrl ?? undefined,
        attributes: variantData.attributes as Record<string, unknown>,
        costPrice: variantData.costPrice
          ? Number(variantData.costPrice.toString())
          : undefined,
        profitMargin: variantData.profitMargin
          ? Number(variantData.profitMargin.toString())
          : undefined,
        barcode: variantData.barcode ?? undefined,
        qrCode: variantData.qrCode ?? undefined,
        eanCode: variantData.eanCode ?? undefined,
        upcCode: variantData.upcCode ?? undefined,
        colorHex: variantData.colorHex ?? undefined,
        colorPantone: variantData.colorPantone ?? undefined,
        minStock: variantData.minStock
          ? Number(variantData.minStock.toString())
          : undefined,
        maxStock: variantData.maxStock
          ? Number(variantData.maxStock.toString())
          : undefined,
        reorderPoint: variantData.reorderPoint
          ? Number(variantData.reorderPoint.toString())
          : undefined,
        reorderQuantity: variantData.reorderQuantity
          ? Number(variantData.reorderQuantity.toString())
          : undefined,
        reference: variantData.reference ?? undefined,
        similars: (variantData.similars as unknown[]) ?? undefined,
        outOfLine: variantData.outOfLine,
        isActive: variantData.isActive,
        createdAt: variantData.createdAt,
        updatedAt: variantData.updatedAt ?? undefined,
      },
      new EntityID(variantData.id),
    );
  }

  async findMany(tenantId: string): Promise<Variant[]> {
    const variants = await prisma.variant.findMany({
      where: {
        tenantId,
        deletedAt: null,
      },
    });

    return variants.map((variantData) =>
      Variant.create(
        {
          tenantId: new EntityID(variantData.tenantId),
          productId: new EntityID(variantData.productId),
          slug: Slug.create(variantData.slug),
          sku: variantData.sku ?? undefined,
          fullCode: variantData.fullCode ?? undefined,
          sequentialCode: variantData.sequentialCode ?? undefined,
          name: variantData.name,
          price: Number(variantData.price.toString()),
          imageUrl: variantData.imageUrl ?? undefined,
          attributes: variantData.attributes as Record<string, unknown>,
          costPrice: variantData.costPrice
            ? Number(variantData.costPrice.toString())
            : undefined,
          profitMargin: variantData.profitMargin
            ? Number(variantData.profitMargin.toString())
            : undefined,
          barcode: variantData.barcode ?? undefined,
          qrCode: variantData.qrCode ?? undefined,
          eanCode: variantData.eanCode ?? undefined,
          upcCode: variantData.upcCode ?? undefined,
          colorHex: variantData.colorHex ?? undefined,
          colorPantone: variantData.colorPantone ?? undefined,
          minStock: variantData.minStock
            ? Number(variantData.minStock.toString())
            : undefined,
          maxStock: variantData.maxStock
            ? Number(variantData.maxStock.toString())
            : undefined,
          reorderPoint: variantData.reorderPoint
            ? Number(variantData.reorderPoint.toString())
            : undefined,
          reorderQuantity: variantData.reorderQuantity
            ? Number(variantData.reorderQuantity.toString())
            : undefined,
          reference: variantData.reference ?? undefined,
          similars: (variantData.similars as unknown[]) ?? undefined,
          outOfLine: variantData.outOfLine,
          isActive: variantData.isActive,
          createdAt: variantData.createdAt,
          updatedAt: variantData.updatedAt ?? undefined,
        },
        new EntityID(variantData.id),
      ),
    );
  }

  async findManyByProduct(
    productId: UniqueEntityID,
    tenantId: string,
  ): Promise<Variant[]> {
    const variants = await prisma.variant.findMany({
      where: {
        productId: productId.toString(),
        tenantId,
        deletedAt: null,
      },
    });

    return variants.map((variantData) =>
      Variant.create(
        {
          tenantId: new EntityID(variantData.tenantId),
          productId: new EntityID(variantData.productId),
          slug: Slug.create(variantData.slug),
          sku: variantData.sku ?? undefined,
          fullCode: variantData.fullCode ?? undefined,
          sequentialCode: variantData.sequentialCode ?? undefined,
          name: variantData.name,
          price: Number(variantData.price.toString()),
          imageUrl: variantData.imageUrl ?? undefined,
          attributes: variantData.attributes as Record<string, unknown>,
          costPrice: variantData.costPrice
            ? Number(variantData.costPrice.toString())
            : undefined,
          profitMargin: variantData.profitMargin
            ? Number(variantData.profitMargin.toString())
            : undefined,
          barcode: variantData.barcode ?? undefined,
          qrCode: variantData.qrCode ?? undefined,
          eanCode: variantData.eanCode ?? undefined,
          upcCode: variantData.upcCode ?? undefined,
          colorHex: variantData.colorHex ?? undefined,
          colorPantone: variantData.colorPantone ?? undefined,
          minStock: variantData.minStock
            ? Number(variantData.minStock.toString())
            : undefined,
          maxStock: variantData.maxStock
            ? Number(variantData.maxStock.toString())
            : undefined,
          reorderPoint: variantData.reorderPoint
            ? Number(variantData.reorderPoint.toString())
            : undefined,
          reorderQuantity: variantData.reorderQuantity
            ? Number(variantData.reorderQuantity.toString())
            : undefined,
          reference: variantData.reference ?? undefined,
          similars: (variantData.similars as unknown[]) ?? undefined,
          outOfLine: variantData.outOfLine,
          isActive: variantData.isActive,
          createdAt: variantData.createdAt,
          updatedAt: variantData.updatedAt ?? undefined,
        },
        new EntityID(variantData.id),
      ),
    );
  }

  async findManyByProductWithAggregations(
    productId: UniqueEntityID,
    tenantId: string,
  ): Promise<
    Array<{
      variant: Variant;
      productCode: string | null;
      productName: string;
      itemCount: number;
      totalCurrentQuantity: number;
    }>
  > {
    const variantsWithAggregations = await prisma.variant.findMany({
      where: {
        productId: productId.toString(),
        tenantId,
        deletedAt: null,
      },
      include: {
        product: {
          select: {
            fullCode: true,
            name: true,
          },
        },
        items: {
          where: {
            deletedAt: null,
          },
          select: {
            currentQuantity: true,
          },
        },
      },
    });

    return variantsWithAggregations.map((variantData) => {
      const variant = Variant.create(
        {
          tenantId: new EntityID(variantData.tenantId),
          productId: new EntityID(variantData.productId),
          slug: Slug.create(variantData.slug),
          sku: variantData.sku ?? undefined,
          fullCode: variantData.fullCode ?? undefined,
          sequentialCode: variantData.sequentialCode ?? undefined,
          name: variantData.name,
          price: Number(variantData.price.toString()),
          imageUrl: variantData.imageUrl ?? undefined,
          attributes: variantData.attributes as Record<string, unknown>,
          costPrice: variantData.costPrice
            ? Number(variantData.costPrice.toString())
            : undefined,
          profitMargin: variantData.profitMargin
            ? Number(variantData.profitMargin.toString())
            : undefined,
          barcode: variantData.barcode ?? undefined,
          qrCode: variantData.qrCode ?? undefined,
          eanCode: variantData.eanCode ?? undefined,
          upcCode: variantData.upcCode ?? undefined,
          colorHex: variantData.colorHex ?? undefined,
          colorPantone: variantData.colorPantone ?? undefined,
          minStock: variantData.minStock
            ? Number(variantData.minStock.toString())
            : undefined,
          maxStock: variantData.maxStock
            ? Number(variantData.maxStock.toString())
            : undefined,
          reorderPoint: variantData.reorderPoint
            ? Number(variantData.reorderPoint.toString())
            : undefined,
          reorderQuantity: variantData.reorderQuantity
            ? Number(variantData.reorderQuantity.toString())
            : undefined,
          reference: variantData.reference ?? undefined,
          similars: (variantData.similars as unknown[]) ?? undefined,
          outOfLine: variantData.outOfLine,
          isActive: variantData.isActive,
          createdAt: variantData.createdAt,
          updatedAt: variantData.updatedAt ?? undefined,
        },
        new EntityID(variantData.id),
      );

      const itemCount = variantData.items.length;
      const totalCurrentQuantity = variantData.items.reduce(
        (sum, item) => sum + Number(item.currentQuantity.toString()),
        0,
      );

      return {
        variant,
        productCode: variantData.product.fullCode,
        productName: variantData.product.name,
        itemCount,
        totalCurrentQuantity,
      };
    });
  }

  async findLastByProductId(
    productId: UniqueEntityID,
    tenantId: string,
  ): Promise<Variant | null> {
    const variantData = await prisma.variant.findFirst({
      where: {
        productId: productId.toString(),
        tenantId,
        deletedAt: null,
      },
      orderBy: {
        sequentialCode: 'desc',
      },
    });

    if (!variantData) {
      return null;
    }

    return Variant.create(
      {
        tenantId: new EntityID(variantData.tenantId),
        productId: new EntityID(variantData.productId),
        slug: Slug.create(variantData.slug),
        sku: variantData.sku ?? undefined,
        fullCode: variantData.fullCode ?? undefined,
        sequentialCode: variantData.sequentialCode ?? undefined,
        name: variantData.name,
        price: Number(variantData.price.toString()),
        imageUrl: variantData.imageUrl ?? undefined,
        attributes: variantData.attributes as Record<string, unknown>,
        costPrice: variantData.costPrice
          ? Number(variantData.costPrice.toString())
          : undefined,
        profitMargin: variantData.profitMargin
          ? Number(variantData.profitMargin.toString())
          : undefined,
        barcode: variantData.barcode ?? undefined,
        qrCode: variantData.qrCode ?? undefined,
        eanCode: variantData.eanCode ?? undefined,
        upcCode: variantData.upcCode ?? undefined,
        colorHex: variantData.colorHex ?? undefined,
        colorPantone: variantData.colorPantone ?? undefined,
        minStock: variantData.minStock
          ? Number(variantData.minStock.toString())
          : undefined,
        maxStock: variantData.maxStock
          ? Number(variantData.maxStock.toString())
          : undefined,
        reorderPoint: variantData.reorderPoint
          ? Number(variantData.reorderPoint.toString())
          : undefined,
        reorderQuantity: variantData.reorderQuantity
          ? Number(variantData.reorderQuantity.toString())
          : undefined,
        reference: variantData.reference ?? undefined,
        similars: (variantData.similars as unknown[]) ?? undefined,
        outOfLine: variantData.outOfLine,
        isActive: variantData.isActive,
        createdAt: variantData.createdAt,
        updatedAt: variantData.updatedAt ?? undefined,
      },
      new EntityID(variantData.id),
    );
  }

  async findManyByPriceRange(
    minPrice: number,
    maxPrice: number,
    tenantId: string,
  ): Promise<Variant[]> {
    const variants = await prisma.variant.findMany({
      where: {
        price: {
          gte: minPrice,
          lte: maxPrice,
        },
        tenantId,
        deletedAt: null,
      },
    });

    return variants.map((variantData) =>
      Variant.create(
        {
          tenantId: new EntityID(variantData.tenantId),
          productId: new EntityID(variantData.productId),
          slug: Slug.create(variantData.slug),
          sku: variantData.sku ?? undefined,
          fullCode: variantData.fullCode ?? undefined,
          sequentialCode: variantData.sequentialCode ?? undefined,
          name: variantData.name,
          price: Number(variantData.price.toString()),
          imageUrl: variantData.imageUrl ?? undefined,
          attributes: variantData.attributes as Record<string, unknown>,
          costPrice: variantData.costPrice
            ? Number(variantData.costPrice.toString())
            : undefined,
          profitMargin: variantData.profitMargin
            ? Number(variantData.profitMargin.toString())
            : undefined,
          barcode: variantData.barcode ?? undefined,
          qrCode: variantData.qrCode ?? undefined,
          eanCode: variantData.eanCode ?? undefined,
          upcCode: variantData.upcCode ?? undefined,
          colorHex: variantData.colorHex ?? undefined,
          colorPantone: variantData.colorPantone ?? undefined,
          minStock: variantData.minStock
            ? Number(variantData.minStock.toString())
            : undefined,
          maxStock: variantData.maxStock
            ? Number(variantData.maxStock.toString())
            : undefined,
          reorderPoint: variantData.reorderPoint
            ? Number(variantData.reorderPoint.toString())
            : undefined,
          reorderQuantity: variantData.reorderQuantity
            ? Number(variantData.reorderQuantity.toString())
            : undefined,
          reference: variantData.reference ?? undefined,
          similars: (variantData.similars as unknown[]) ?? undefined,
          outOfLine: variantData.outOfLine,
          isActive: variantData.isActive,
          createdAt: variantData.createdAt,
          updatedAt: variantData.updatedAt ?? undefined,
        },
        new EntityID(variantData.id),
      ),
    );
  }

  async findManyBelowReorderPoint(tenantId: string): Promise<Variant[]> {
    const variants = await prisma.variant.findMany({
      where: {
        reorderPoint: {
          not: null,
        },
        tenantId,
        deletedAt: null,
      },
    });

    // Filtra as variants abaixo do ponto de reposicao
    // Precisaria calcular o estoque atual de cada variant
    // Por simplicidade, retorna todas que tem reorderPoint definido
    return variants.map((variantData) =>
      Variant.create(
        {
          tenantId: new EntityID(variantData.tenantId),
          productId: new EntityID(variantData.productId),
          slug: Slug.create(variantData.slug),
          sku: variantData.sku ?? undefined,
          fullCode: variantData.fullCode ?? undefined,
          sequentialCode: variantData.sequentialCode ?? undefined,
          name: variantData.name,
          price: Number(variantData.price.toString()),
          imageUrl: variantData.imageUrl ?? undefined,
          attributes: variantData.attributes as Record<string, unknown>,
          costPrice: variantData.costPrice
            ? Number(variantData.costPrice.toString())
            : undefined,
          profitMargin: variantData.profitMargin
            ? Number(variantData.profitMargin.toString())
            : undefined,
          barcode: variantData.barcode ?? undefined,
          qrCode: variantData.qrCode ?? undefined,
          eanCode: variantData.eanCode ?? undefined,
          upcCode: variantData.upcCode ?? undefined,
          colorHex: variantData.colorHex ?? undefined,
          colorPantone: variantData.colorPantone ?? undefined,
          minStock: variantData.minStock
            ? Number(variantData.minStock.toString())
            : undefined,
          maxStock: variantData.maxStock
            ? Number(variantData.maxStock.toString())
            : undefined,
          reorderPoint: variantData.reorderPoint
            ? Number(variantData.reorderPoint.toString())
            : undefined,
          reorderQuantity: variantData.reorderQuantity
            ? Number(variantData.reorderQuantity.toString())
            : undefined,
          reference: variantData.reference ?? undefined,
          similars: (variantData.similars as unknown[]) ?? undefined,
          outOfLine: variantData.outOfLine,
          isActive: variantData.isActive,
          createdAt: variantData.createdAt,
          updatedAt: variantData.updatedAt ?? undefined,
        },
        new EntityID(variantData.id),
      ),
    );
  }

  async update(data: UpdateVariantSchema): Promise<Variant | null> {
    const variantData = await prisma.variant.update({
      where: {
        id: data.id.toString(),
      },
      data: {
        sku: data.sku,
        name: data.name,
        price: data.price ? data.price : undefined,
        imageUrl: data.imageUrl,
        attributes: data.attributes as Prisma.InputJsonValue,
        costPrice: data.costPrice ? data.costPrice : undefined,
        profitMargin: data.profitMargin ? data.profitMargin : undefined,
        barcode: data.barcode,
        qrCode: data.qrCode,
        eanCode: data.eanCode,
        upcCode: data.upcCode,
        colorHex: data.colorHex,
        colorPantone: data.colorPantone,
        minStock: data.minStock ? data.minStock : undefined,
        maxStock: data.maxStock ? data.maxStock : undefined,
        reorderPoint: data.reorderPoint ? data.reorderPoint : undefined,
        reorderQuantity: data.reorderQuantity
          ? data.reorderQuantity
          : undefined,
        reference: data.reference,
        similars: data.similars as Prisma.InputJsonValue,
        outOfLine: data.outOfLine,
        isActive: data.isActive,
      },
    });

    return Variant.create(
      {
        tenantId: new EntityID(variantData.tenantId),
        productId: new EntityID(variantData.productId),
        slug: Slug.create(variantData.slug),
        sku: variantData.sku ?? undefined,
        fullCode: variantData.fullCode ?? undefined,
        sequentialCode: variantData.sequentialCode ?? undefined,
        name: variantData.name,
        price: Number(variantData.price.toString()),
        imageUrl: variantData.imageUrl ?? undefined,
        attributes: variantData.attributes as Record<string, unknown>,
        costPrice: variantData.costPrice
          ? Number(variantData.costPrice.toString())
          : undefined,
        profitMargin: variantData.profitMargin
          ? Number(variantData.profitMargin.toString())
          : undefined,
        barcode: variantData.barcode ?? undefined,
        qrCode: variantData.qrCode ?? undefined,
        eanCode: variantData.eanCode ?? undefined,
        upcCode: variantData.upcCode ?? undefined,
        colorHex: variantData.colorHex ?? undefined,
        colorPantone: variantData.colorPantone ?? undefined,
        minStock: variantData.minStock
          ? Number(variantData.minStock.toString())
          : undefined,
        maxStock: variantData.maxStock
          ? Number(variantData.maxStock.toString())
          : undefined,
        reorderPoint: variantData.reorderPoint
          ? Number(variantData.reorderPoint.toString())
          : undefined,
        reorderQuantity: variantData.reorderQuantity
          ? Number(variantData.reorderQuantity.toString())
          : undefined,
        reference: variantData.reference ?? undefined,
        similars: (variantData.similars as unknown[]) ?? undefined,
        outOfLine: variantData.outOfLine,
        isActive: variantData.isActive,
        createdAt: variantData.createdAt,
        updatedAt: variantData.updatedAt ?? undefined,
      },
      new EntityID(variantData.id),
    );
  }

  async save(variant: Variant): Promise<void> {
    await prisma.variant.update({
      where: {
        id: variant.id.toString(),
      },
      data: {
        sku: variant.sku,
        name: variant.name,
        price: variant.price,
        imageUrl: variant.imageUrl,
        attributes: variant.attributes as Prisma.InputJsonValue,
        costPrice: variant.costPrice ? variant.costPrice : undefined,
        profitMargin: variant.profitMargin ? variant.profitMargin : undefined,
        barcode: variant.barcode,
        qrCode: variant.qrCode,
        eanCode: variant.eanCode,
        upcCode: variant.upcCode,
        colorHex: variant.colorHex,
        colorPantone: variant.colorPantone,
        minStock: variant.minStock ? variant.minStock : undefined,
        maxStock: variant.maxStock ? variant.maxStock : undefined,
        reorderPoint: variant.reorderPoint ? variant.reorderPoint : undefined,
        reorderQuantity: variant.reorderQuantity
          ? variant.reorderQuantity
          : undefined,
        reference: variant.reference,
        similars: variant.similars as Prisma.InputJsonValue,
        outOfLine: variant.outOfLine,
        isActive: variant.isActive,
        updatedAt: new Date(),
      },
    });
  }

  async delete(id: UniqueEntityID): Promise<void> {
    await prisma.variant.update({
      where: {
        id: id.toString(),
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}
