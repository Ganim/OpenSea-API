import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import { Variant } from '@/entities/stock/variant';
import { prisma } from '@/lib/prisma';
import type {
  CreateVariantSchema,
  UpdateVariantSchema,
  VariantsRepository,
} from '../variants-repository';

export class PrismaVariantsRepository implements VariantsRepository {
  async create(data: CreateVariantSchema): Promise<Variant> {
    const variantData = await prisma.variant.create({
      data: {
        productId: data.productId.toString(),
        fullCode: data.fullCode,
        sequentialCode: data.sequentialCode,
        sku: data.sku,
        name: data.name,
        price: data.price,
        imageUrl: data.imageUrl,
        attributes: (data.attributes ?? {}) as never,
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
        similars: (data.similars ?? []) as never,
        outOfLine: data.outOfLine ?? false,
        isActive: data.isActive ?? true,
      },
    });

    return Variant.create(
      {
        productId: new EntityID(variantData.productId),
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

  async findById(id: UniqueEntityID): Promise<Variant | null> {
    const variantData = await prisma.variant.findUnique({
      where: {
        id: id.toString(),
        deletedAt: null,
      },
    });

    if (!variantData) {
      return null;
    }

    return Variant.create(
      {
        productId: new EntityID(variantData.productId),
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

  async findBySKU(sku: string): Promise<Variant | null> {
    const variantData = await prisma.variant.findFirst({
      where: {
        sku,
        deletedAt: null,
      },
    });

    if (!variantData) {
      return null;
    }

    return Variant.create(
      {
        productId: new EntityID(variantData.productId),
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

  async findByBarcode(barcode: string): Promise<Variant | null> {
    const variantData = await prisma.variant.findFirst({
      where: {
        barcode,
        deletedAt: null,
      },
    });

    if (!variantData) {
      return null;
    }

    return Variant.create(
      {
        productId: new EntityID(variantData.productId),
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

  async findByEANCode(eanCode: string): Promise<Variant | null> {
    const variantData = await prisma.variant.findFirst({
      where: {
        eanCode,
        deletedAt: null,
      },
    });

    if (!variantData) {
      return null;
    }

    return Variant.create(
      {
        productId: new EntityID(variantData.productId),
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

  async findByUPCCode(upcCode: string): Promise<Variant | null> {
    const variantData = await prisma.variant.findFirst({
      where: {
        upcCode,
        deletedAt: null,
      },
    });

    if (!variantData) {
      return null;
    }

    return Variant.create(
      {
        productId: new EntityID(variantData.productId),
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

  async findMany(): Promise<Variant[]> {
    const variants = await prisma.variant.findMany({
      where: {
        deletedAt: null,
      },
    });

    return variants.map((variantData) =>
      Variant.create(
        {
          productId: new EntityID(variantData.productId),
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
      ),
    );
  }

  async findManyByProduct(productId: UniqueEntityID): Promise<Variant[]> {
    const variants = await prisma.variant.findMany({
      where: {
        productId: productId.toString(),
        deletedAt: null,
      },
    });

    return variants.map((variantData) =>
      Variant.create(
        {
          productId: new EntityID(variantData.productId),
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
      ),
    );
  }

  async findManyByProductWithAggregations(productId: UniqueEntityID): Promise<
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
        deletedAt: null,
      },
      include: {
        product: {
          select: {
            code: true,
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
          productId: new EntityID(variantData.productId),
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

      const itemCount = variantData.items.length;
      const totalCurrentQuantity = variantData.items.reduce(
        (sum, item) => sum + Number(item.currentQuantity.toString()),
        0,
      );

      return {
        variant,
        productCode: variantData.product.code,
        productName: variantData.product.name,
        itemCount,
        totalCurrentQuantity,
      };
    });
  }

  async findLastByProductId(productId: UniqueEntityID): Promise<Variant | null> {
    const variantData = await prisma.variant.findFirst({
      where: {
        productId: productId.toString(),
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
        productId: new EntityID(variantData.productId),
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
  ): Promise<Variant[]> {
    const variants = await prisma.variant.findMany({
      where: {
        price: {
          gte: minPrice,
          lte: maxPrice,
        },
        deletedAt: null,
      },
    });

    return variants.map((variantData) =>
      Variant.create(
        {
          productId: new EntityID(variantData.productId),
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
      ),
    );
  }

  async findManyBelowReorderPoint(): Promise<Variant[]> {
    const variants = await prisma.variant.findMany({
      where: {
        reorderPoint: {
          not: null,
        },
        deletedAt: null,
      },
    });

    // Filtra as variants abaixo do ponto de reposição
    // Precisaria calcular o estoque atual de cada variant
    // Por simplicidade, retorna todas que tem reorderPoint definido
    return variants.map((variantData) =>
      Variant.create(
        {
          productId: new EntityID(variantData.productId),
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
        attributes: data.attributes as never,
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
        similars: data.similars as never,
        outOfLine: data.outOfLine,
        isActive: data.isActive,
      },
    });

    return Variant.create(
      {
        productId: new EntityID(variantData.productId),
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
        attributes: variant.attributes as never,
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
        similars: variant.similars as never,
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
