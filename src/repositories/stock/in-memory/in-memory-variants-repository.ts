import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Variant } from '@/entities/stock/variant';
import type {
  CreateVariantSchema,
  UpdateVariantSchema,
  VariantsRepository,
} from '../variants-repository';

export class InMemoryVariantsRepository implements VariantsRepository {
  public items: Variant[] = [];

  async create(data: CreateVariantSchema): Promise<Variant> {
    const variant = Variant.create({
      tenantId: new UniqueEntityID(data.tenantId),
      productId: data.productId,
      slug: data.slug,
      sku: data.sku,
      fullCode: data.fullCode,
      sequentialCode: data.sequentialCode,
      name: data.name,
      price: data.price,
      imageUrl: data.imageUrl,
      costPrice: data.costPrice,
      profitMargin: data.profitMargin,
      barcode: data.barcode ?? '',
      qrCode: data.qrCode,
      eanCode: data.eanCode ?? '',
      upcCode: data.upcCode ?? '',
      colorHex: data.colorHex,
      colorPantone: data.colorPantone,
      minStock: data.minStock,
      maxStock: data.maxStock,
      reorderPoint: data.reorderPoint,
      reorderQuantity: data.reorderQuantity,
      attributes: data.attributes ?? {},
      reference: data.reference,
      similars: data.similars,
      outOfLine: data.outOfLine,
      isActive: data.isActive,
    });

    this.items.push(variant);
    return variant;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<Variant | null> {
    const variant = this.items.find(
      (item) =>
        !item.deletedAt &&
        item.id.equals(id) &&
        item.tenantId.toString() === tenantId,
    );
    return variant ?? null;
  }

  async findBySKU(sku: string, tenantId: string): Promise<Variant | null> {
    const variant = this.items.find(
      (item) =>
        !item.deletedAt &&
        item.sku === sku &&
        item.tenantId.toString() === tenantId,
    );
    return variant ?? null;
  }

  async findByBarcode(
    barcode: string,
    tenantId: string,
  ): Promise<Variant | null> {
    const variant = this.items.find(
      (item) =>
        !item.deletedAt &&
        item.barcode === barcode &&
        item.tenantId.toString() === tenantId,
    );
    return variant ?? null;
  }

  async findByEANCode(
    eanCode: string,
    tenantId: string,
  ): Promise<Variant | null> {
    const variant = this.items.find(
      (item) =>
        !item.deletedAt &&
        item.eanCode === eanCode &&
        item.tenantId.toString() === tenantId,
    );
    return variant ?? null;
  }

  async findByUPCCode(
    upcCode: string,
    tenantId: string,
  ): Promise<Variant | null> {
    const variant = this.items.find(
      (item) =>
        !item.deletedAt &&
        item.upcCode === upcCode &&
        item.tenantId.toString() === tenantId,
    );
    return variant ?? null;
  }

  async findMany(tenantId: string): Promise<Variant[]> {
    return this.items.filter(
      (item) => !item.deletedAt && item.tenantId.toString() === tenantId,
    );
  }

  async findManyByProduct(
    productId: UniqueEntityID,
    tenantId: string,
  ): Promise<Variant[]> {
    return this.items.filter(
      (item) =>
        !item.deletedAt &&
        item.productId.equals(productId) &&
        item.tenantId.toString() === tenantId,
    );
  }

  async findLastByProductId(
    productId: UniqueEntityID,
    tenantId: string,
  ): Promise<Variant | null> {
    const variants = this.items
      .filter(
        (item) =>
          !item.deletedAt &&
          item.productId.equals(productId) &&
          item.tenantId.toString() === tenantId,
      )
      .sort((a, b) => (b.sequentialCode ?? 0) - (a.sequentialCode ?? 0));
    return variants[0] ?? null;
  }

  async findManyByPriceRange(
    minPrice: number,
    maxPrice: number,
    tenantId: string,
  ): Promise<Variant[]> {
    return this.items.filter(
      (item) =>
        !item.deletedAt &&
        item.price >= minPrice &&
        item.price <= maxPrice &&
        item.tenantId.toString() === tenantId,
    );
  }

  async findManyBelowReorderPoint(tenantId: string): Promise<Variant[]> {
    return this.items.filter(
      (item) =>
        !item.deletedAt &&
        item.reorderPoint !== null &&
        item.reorderPoint !== undefined &&
        item.tenantId.toString() === tenantId,
    );
  }

  async findManyByProductWithAggregations(
    productId: UniqueEntityID,
    tenantId: string,
  ): Promise<
    Array<{
      variant: Variant;
      productCode: string;
      productName: string;
      itemCount: number;
      totalCurrentQuantity: number;
    }>
  > {
    const variants = this.items.filter(
      (item) =>
        !item.deletedAt &&
        item.productId.equals(productId) &&
        item.tenantId.toString() === tenantId,
    );

    // Mock data for testing - in real implementation, this would aggregate from items
    return variants.map((variant) => ({
      variant,
      productCode: 'PROD001', // Mock
      productName: 'Mock Product', // Mock
      itemCount: 5, // Mock
      totalCurrentQuantity: 100, // Mock
    }));
  }

  async update(data: UpdateVariantSchema): Promise<Variant | null> {
    const variant =
      this.items.find((item) => !item.deletedAt && item.id.equals(data.id)) ??
      null;
    if (!variant) return null;

    if (data.sku !== undefined) variant.sku = data.sku;
    if (data.name !== undefined) variant.name = data.name;
    if (data.price !== undefined) variant.price = data.price;
    if (data.imageUrl !== undefined) variant.imageUrl = data.imageUrl;
    if (data.costPrice !== undefined) variant.costPrice = data.costPrice;
    if (data.profitMargin !== undefined)
      variant.profitMargin = data.profitMargin;
    // barcode, eanCode, upcCode are immutable after creation - skip them
    if (data.qrCode !== undefined) variant.qrCode = data.qrCode;
    if (data.minStock !== undefined) variant.minStock = data.minStock;
    if (data.maxStock !== undefined) variant.maxStock = data.maxStock;
    if (data.reorderPoint !== undefined)
      variant.reorderPoint = data.reorderPoint;
    if (data.reorderQuantity !== undefined)
      variant.reorderQuantity = data.reorderQuantity;
    if (data.attributes !== undefined) variant.attributes = data.attributes;

    return variant;
  }

  async save(variant: Variant): Promise<void> {
    const index = this.items.findIndex((i) => i.id.equals(variant.id));
    if (index >= 0) {
      this.items[index] = variant;
    } else {
      this.items.push(variant);
    }
  }

  async delete(id: UniqueEntityID): Promise<void> {
    const variant =
      this.items.find((item) => !item.deletedAt && item.id.equals(id)) ?? null;
    if (variant) {
      variant.delete();
    }
  }
}
