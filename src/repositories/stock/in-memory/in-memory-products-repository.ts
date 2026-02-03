import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Product } from '@/entities/stock/product';
import { CareInstructions } from '@/entities/stock/value-objects/care-instructions';
import { ProductStatus } from '@/entities/stock/value-objects/product-status';
import type {
  CreateProductSchema,
  ProductsRepository,
  UpdateProductSchema,
} from '../products-repository';

export class InMemoryProductsRepository implements ProductsRepository {
  public items: Product[] = [];
  private sequentialCounter = 0;

  async create(data: CreateProductSchema): Promise<Product> {
    const product = Product.create({
      tenantId: new UniqueEntityID(data.tenantId),
      name: data.name,
      slug: data.slug,
      fullCode: data.fullCode,
      barcode: data.barcode,
      eanCode: data.eanCode,
      upcCode: data.upcCode,
      description: data.description,
      status: data.status,
      outOfLine: data.outOfLine ?? false,
      templateId: data.templateId, // Obrigatório
      supplierId: data.supplierId,
      manufacturerId: data.manufacturerId,
      attributes: data.attributes ?? {},
    });

    this.items.push(product);
    return product;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<Product | null> {
    const product = this.items.find(
      (item) =>
        !item.deletedAt &&
        item.id.equals(id) &&
        item.tenantId.toString() === tenantId,
    );
    return product ?? null;
  }

  async findByName(name: string, tenantId: string): Promise<Product | null> {
    const product = this.items.find(
      (item) =>
        !item.deletedAt &&
        item.name === name &&
        item.tenantId.toString() === tenantId,
    );
    return product ?? null;
  }

  async findMany(tenantId: string): Promise<Product[]> {
    return this.items.filter(
      (item) => !item.deletedAt && item.tenantId.toString() === tenantId,
    );
  }

  async findManyByStatus(
    status: ProductStatus,
    tenantId: string,
  ): Promise<Product[]> {
    return this.items.filter(
      (item) =>
        !item.deletedAt &&
        item.status.value === status.value &&
        item.tenantId.toString() === tenantId,
    );
  }

  async findManyByTemplate(
    templateId: UniqueEntityID,
    tenantId: string,
  ): Promise<Product[]> {
    return this.items.filter(
      (item) =>
        !item.deletedAt &&
        item.templateId?.equals(templateId) &&
        item.tenantId.toString() === tenantId,
    );
  }

  async findManyByManufacturer(
    manufacturerId: UniqueEntityID,
    tenantId: string,
  ): Promise<Product[]> {
    return this.items.filter(
      (item) =>
        !item.deletedAt &&
        item.manufacturerId?.equals(manufacturerId) &&
        item.tenantId.toString() === tenantId,
    );
  }

  async findManyByCategory(
    categoryId: UniqueEntityID,
    tenantId: string,
  ): Promise<Product[]> {
    // TODO: Implementar relacionamento Product-Category quando disponível
    return this.items.filter(
      (item) => !item.deletedAt && item.tenantId.toString() === tenantId,
    );
  }

  async update(data: UpdateProductSchema): Promise<Product | null> {
    const product =
      this.items.find((item) => !item.deletedAt && item.id.equals(data.id)) ??
      null;
    if (!product) return null;

    if (data.name !== undefined) product.name = data.name;
    // code e fullCode são imutáveis após criação
    if (data.description !== undefined) product.description = data.description;
    if (data.status !== undefined) product.status = data.status;
    if (data.outOfLine !== undefined) product.outOfLine = data.outOfLine;
    if (data.supplierId !== undefined) product.supplierId = data.supplierId;
    if (data.manufacturerId !== undefined)
      product.manufacturerId = data.manufacturerId;
    if (data.attributes !== undefined) product.attributes = data.attributes;

    return product;
  }

  async updateCareInstructions(
    productId: UniqueEntityID,
    careInstructionIds: string[],
  ): Promise<Product> {
    const product =
      this.items.find((item) => !item.deletedAt && item.id.equals(productId)) ??
      null;
    if (!product) {
      throw new ResourceNotFoundError('Product not found');
    }

    product.careInstructions = CareInstructions.create(careInstructionIds);
    return product;
  }

  async save(product: Product): Promise<void> {
    const index = this.items.findIndex((i) => i.id.equals(product.id));
    if (index >= 0) {
      this.items[index] = product;
    } else {
      this.items.push(product);
    }
  }

  async delete(id: UniqueEntityID): Promise<void> {
    const product =
      this.items.find((item) => !item.deletedAt && item.id.equals(id)) ?? null;
    if (product) {
      product.delete();
    }
  }

  async getNextSequentialCode(): Promise<number> {
    this.sequentialCounter += 1;
    return this.sequentialCounter;
  }
}
