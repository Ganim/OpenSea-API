import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import { Variant } from '@/entities/stock/variant';
import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';
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
        sku: data.sku,
        name: data.name,
        price: new Decimal(data.price),
        imageUrl: data.imageUrl,
        attributes: (data.attributes ?? {}) as never,
        costPrice: data.costPrice ? new Decimal(data.costPrice) : undefined,
        profitMargin: data.profitMargin
          ? new Decimal(data.profitMargin)
          : undefined,
        barcode: data.barcode,
        qrCode: data.qrCode,
        eanCode: data.eanCode,
        upcCode: data.upcCode,
        colorHex: data.colorHex,
        colorPantone: data.colorPantone,
        minStock: data.minStock ? new Decimal(data.minStock) : undefined,
        maxStock: data.maxStock ? new Decimal(data.maxStock) : undefined,
        reorderPoint: data.reorderPoint
          ? new Decimal(data.reorderPoint)
          : undefined,
        reorderQuantity: data.reorderQuantity
          ? new Decimal(data.reorderQuantity)
          : undefined,
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
        createdAt: variantData.createdAt,
        updatedAt: variantData.updatedAt ?? undefined,
      },
      new EntityID(variantData.id),
    );
  }

  async findBySKU(sku: string): Promise<Variant | null> {
    const variantData = await prisma.variant.findUnique({
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
        createdAt: variantData.createdAt,
        updatedAt: variantData.updatedAt ?? undefined,
      },
      new EntityID(variantData.id),
    );
  }

  async findByBarcode(barcode: string): Promise<Variant | null> {
    const variantData = await prisma.variant.findUnique({
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
        createdAt: variantData.createdAt,
        updatedAt: variantData.updatedAt ?? undefined,
      },
      new EntityID(variantData.id),
    );
  }

  async findByEANCode(eanCode: string): Promise<Variant | null> {
    const variantData = await prisma.variant.findUnique({
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
        createdAt: variantData.createdAt,
        updatedAt: variantData.updatedAt ?? undefined,
      },
      new EntityID(variantData.id),
    );
  }

  async findByUPCCode(upcCode: string): Promise<Variant | null> {
    const variantData = await prisma.variant.findUnique({
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

  async findManyByPriceRange(
    minPrice: number,
    maxPrice: number,
  ): Promise<Variant[]> {
    const variants = await prisma.variant.findMany({
      where: {
        price: {
          gte: new Decimal(minPrice),
          lte: new Decimal(maxPrice),
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
        price: data.price ? new Decimal(data.price) : undefined,
        imageUrl: data.imageUrl,
        attributes: data.attributes as never,
        costPrice: data.costPrice ? new Decimal(data.costPrice) : undefined,
        profitMargin: data.profitMargin
          ? new Decimal(data.profitMargin)
          : undefined,
        barcode: data.barcode,
        qrCode: data.qrCode,
        eanCode: data.eanCode,
        upcCode: data.upcCode,
        minStock: data.minStock ? new Decimal(data.minStock) : undefined,
        maxStock: data.maxStock ? new Decimal(data.maxStock) : undefined,
        reorderPoint: data.reorderPoint
          ? new Decimal(data.reorderPoint)
          : undefined,
        reorderQuantity: data.reorderQuantity
          ? new Decimal(data.reorderQuantity)
          : undefined,
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
        price: new Decimal(variant.price),
        imageUrl: variant.imageUrl,
        attributes: variant.attributes as never,
        costPrice: variant.costPrice
          ? new Decimal(variant.costPrice)
          : undefined,
        profitMargin: variant.profitMargin
          ? new Decimal(variant.profitMargin)
          : undefined,
        barcode: variant.barcode,
        qrCode: variant.qrCode,
        eanCode: variant.eanCode,
        upcCode: variant.upcCode,
        minStock: variant.minStock ? new Decimal(variant.minStock) : undefined,
        maxStock: variant.maxStock ? new Decimal(variant.maxStock) : undefined,
        reorderPoint: variant.reorderPoint
          ? new Decimal(variant.reorderPoint)
          : undefined,
        reorderQuantity: variant.reorderQuantity
          ? new Decimal(variant.reorderQuantity)
          : undefined,
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
