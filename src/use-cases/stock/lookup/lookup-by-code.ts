import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Item } from '@/entities/stock/item';
import type { BinsRepository } from '@/repositories/stock/bins-repository';
import type { ItemsRepository } from '@/repositories/stock/items-repository';
import type { ManufacturersRepository } from '@/repositories/stock/manufacturers-repository';
import type { ProductsRepository } from '@/repositories/stock/products-repository';
import type { TemplatesRepository } from '@/repositories/stock/templates-repository';
import type { VariantsRepository } from '@/repositories/stock/variants-repository';

const ITEM_PATTERN = /^\d{3}\.\d{3}\.\d{4}\.\d{3}-\d{5}$/;
const VARIANT_PATTERN = /^\d{3}\.\d{3}\.\d{4}\.\d{3}$/;
const PRODUCT_PATTERN = /^\d{3}\.\d{3}\.\d{4}$/;
const BIN_PATTERN = /^[A-Z]{2,5}-[A-Z]{2,5}-\d{1,5}-[A-Z0-9]{1,3}$/;

export type LookupEntityType = 'ITEM' | 'VARIANT' | 'PRODUCT' | 'BIN';

interface LookupByCodeUseCaseRequest {
  tenantId: string;
  code: string;
}

interface LookupByCodeUseCaseResponse {
  entityType: LookupEntityType;
  entityId: string;
  entity: Record<string, unknown>;
}

export class LookupByCodeUseCase {
  constructor(
    private itemsRepository: ItemsRepository,
    private variantsRepository: VariantsRepository,
    private productsRepository: ProductsRepository,
    private binsRepository: BinsRepository,
    private templatesRepository?: TemplatesRepository,
    private manufacturersRepository?: ManufacturersRepository,
  ) {}

  async execute(
    input: LookupByCodeUseCaseRequest,
  ): Promise<LookupByCodeUseCaseResponse> {
    const { tenantId, code } = input;

    // 1. Try pattern match
    if (ITEM_PATTERN.test(code)) {
      const item = await this.itemsRepository.findByFullCode(code, tenantId);
      if (item) {
        return this.enrichItem(item, tenantId);
      }
    }

    if (VARIANT_PATTERN.test(code)) {
      const variant = await this.variantsRepository.findByFullCode(
        code,
        tenantId,
      );
      if (variant) {
        return {
          entityType: 'VARIANT',
          entityId: variant.id.toString(),
          entity: {
            id: variant.id.toString(),
            name: variant.name,
            sku: variant.sku,
            fullCode: variant.fullCode,
            barcode: variant.barcode,
            price: variant.price,
            colorHex: variant.colorHex,
            status: variant.isActive ? 'Ativa' : 'Inativa',
          },
        };
      }
    }

    if (PRODUCT_PATTERN.test(code)) {
      const product = await this.productsRepository.findByFullCode(
        code,
        tenantId,
      );
      if (product) {
        return {
          entityType: 'PRODUCT',
          entityId: product.id.toString(),
          entity: {
            id: product.id.toString(),
            name: product.name,
            fullCode: product.fullCode,
            code: product.fullCode,
          },
        };
      }
    }

    if (BIN_PATTERN.test(code)) {
      const bin = await this.binsRepository.findByAddress(code, tenantId);
      if (bin) {
        return {
          entityType: 'BIN',
          entityId: bin.binId.toString(),
          entity: {
            id: bin.binId.toString(),
            name: bin.address,
            code: bin.address,
            quantity: bin.currentOccupancy,
            status: bin.isBlocked
              ? 'Bloqueado'
              : bin.isActive
                ? 'Ativo'
                : 'Inativo',
          },
        };
      }
    }

    // 2. Fallback: try barcode, eanCode, upcCode lookup on items
    const itemByBarcode = await this.itemsRepository.findByBarcode(
      code,
      tenantId,
    );
    if (itemByBarcode) {
      return this.enrichItem(itemByBarcode, tenantId);
    }

    const itemByEan = await this.itemsRepository.findByEanCode(code, tenantId);
    if (itemByEan) {
      return this.enrichItem(itemByEan, tenantId);
    }

    const itemByUpc = await this.itemsRepository.findByUpcCode(code, tenantId);
    if (itemByUpc) {
      return this.enrichItem(itemByUpc, tenantId);
    }

    // 3. Nothing found
    throw new ResourceNotFoundError(`No entity found for code: ${code}`);
  }

  /**
   * Enrich an Item with variant name, product name, and bin address
   */
  private async enrichItem(
    item: Item,
    tenantId: string,
  ): Promise<LookupByCodeUseCaseResponse> {
    // Fetch related data in parallel
    const [variant, bin] = await Promise.all([
      this.variantsRepository.findById(
        new UniqueEntityID(item.variantId.toString()),
        tenantId,
      ),
      item.binId
        ? this.binsRepository.findById(
            new UniqueEntityID(item.binId.toString()),
            tenantId,
          )
        : null,
    ]);

    // Fetch product
    const product = variant
      ? await this.productsRepository.findById(
          new UniqueEntityID(variant.productId.toString()),
          tenantId,
        )
      : null;

    // Fetch template and manufacturer in parallel (optional repos)
    const [template, manufacturer] = await Promise.all([
      product?.templateId && this.templatesRepository
        ? this.templatesRepository.findById(
            new UniqueEntityID(product.templateId.toString()),
            tenantId,
          )
        : null,
      product?.manufacturerId && this.manufacturersRepository
        ? this.manufacturersRepository.findById(
            new UniqueEntityID(product.manufacturerId.toString()),
            tenantId,
          )
        : null,
    ]);

    const binAddress = bin?.address ?? item.lastKnownAddress;

    return {
      entityType: 'ITEM',
      entityId: item.id.toString(),
      entity: {
        id: item.id.toString(),
        name: [product?.name, variant?.name].filter(Boolean).join(' · '),
        sku: variant?.sku,
        barcode: item.barcode,
        fullCode: item.fullCode,
        variantName: variant?.name,
        productName: product?.name,
        templateName: template?.name,
        unitOfMeasure: template?.unitOfMeasure,
        manufacturerName: manufacturer?.name,
        reference: variant?.reference,
        colorHex: variant?.colorHex,
        secondaryColorHex: variant?.secondaryColorHex,
        pattern: variant?.pattern,
        binLabel: binAddress,
        location: binAddress,
        batch: item.batchNumber,
        expiresAt: item.expiryDate?.toISOString(),
        manufacturedAt: item.manufacturingDate?.toISOString(),
        quantity: item.currentQuantity,
        status: item.status.value,
      },
    };
  }
}
