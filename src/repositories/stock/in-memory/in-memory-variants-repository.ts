import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
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
      productId: data.productId,
      sku: data.sku,
      fullCode: data.fullCode,
      sequentialCode: data.sequentialCode,
      name: data.name,
      price: data.price,
      imageUrl: data.imageUrl,
      costPrice: data.costPrice,
      profitMargin: data.profitMargin,
      barcode: data.barcode,
      qrCode: data.qrCode,
      eanCode: data.eanCode,
      upcCode: data.upcCode,
      minStock: data.minStock,
      maxStock: data.maxStock,
      reorderPoint: data.reorderPoint,
      reorderQuantity: data.reorderQuantity,
      attributes: data.attributes ?? {},
    });

    this.items.push(variant);
    return variant;
  }

  async findById(id: UniqueEntityID): Promise<Variant | null> {
    const variant = this.items.find(
      (item) => !item.deletedAt && item.id.equals(id),
    );
    return variant ?? null;
  }

  async findBySKU(sku: string): Promise<Variant | null> {
    const variant = this.items.find(
      (item) => !item.deletedAt && item.sku === sku,
    );
    return variant ?? null;
  }

  async findByBarcode(barcode: string): Promise<Variant | null> {
    const variant = this.items.find(
      (item) => !item.deletedAt && item.barcode === barcode,
    );
    return variant ?? null;
  }

  async findByEANCode(eanCode: string): Promise<Variant | null> {
    const variant = this.items.find(
      (item) => !item.deletedAt && item.eanCode === eanCode,
    );
    return variant ?? null;
  }

  async findByUPCCode(upcCode: string): Promise<Variant | null> {
    const variant = this.items.find(
      (item) => !item.deletedAt && item.upcCode === upcCode,
    );
    return variant ?? null;
  }

  async findMany(): Promise<Variant[]> {
    return this.items.filter((item) => !item.deletedAt);
  }

  async findManyByProduct(productId: UniqueEntityID): Promise<Variant[]> {
    return this.items.filter(
      (item) => !item.deletedAt && item.productId.equals(productId),
    );
  }

  async findLastByProductId(productId: UniqueEntityID): Promise<Variant | null> {
    const variants = this.items
      .filter((item) => !item.deletedAt && item.productId.equals(productId))
      .sort((a, b) => (b.sequentialCode ?? 0) - (a.sequentialCode ?? 0));
    return variants[0] ?? null;
  }

  async findManyByPriceRange(
    minPrice: number,
    maxPrice: number,
  ): Promise<Variant[]> {
    return this.items.filter(
      (item) =>
        !item.deletedAt && item.price >= minPrice && item.price <= maxPrice,
    );
  }

  async findManyBelowReorderPoint(): Promise<Variant[]> {
    return this.items.filter(
      (item) =>
        !item.deletedAt &&
        item.reorderPoint !== null &&
        item.reorderPoint !== undefined,
    );
  }

  async findManyByProductWithAggregations(productId: UniqueEntityID): Promise<
    Array<{
      variant: Variant;
      productCode: string;
      productName: string;
      itemCount: number;
      totalCurrentQuantity: number;
    }>
  > {
    const variants = this.items.filter(
      (item) => !item.deletedAt && item.productId.equals(productId),
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
    const variant = await this.findById(data.id);
    if (!variant) return null;

    if (data.sku !== undefined) variant.sku = data.sku;
    if (data.name !== undefined) variant.name = data.name;
    if (data.price !== undefined) variant.price = data.price;
    if (data.imageUrl !== undefined) variant.imageUrl = data.imageUrl;
    if (data.costPrice !== undefined) variant.costPrice = data.costPrice;
    if (data.profitMargin !== undefined)
      variant.profitMargin = data.profitMargin;
    if (data.barcode !== undefined) variant.barcode = data.barcode;
    if (data.qrCode !== undefined) variant.qrCode = data.qrCode;
    if (data.eanCode !== undefined) variant.eanCode = data.eanCode;
    if (data.upcCode !== undefined) variant.upcCode = data.upcCode;
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
    const variant = await this.findById(id);
    if (variant) {
      variant.delete();
    }
  }
}
