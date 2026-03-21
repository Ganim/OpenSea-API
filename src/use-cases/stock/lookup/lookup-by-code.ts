import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { Bin } from '@/entities/stock/bin';
import type { Item } from '@/entities/stock/item';
import type { Product } from '@/entities/stock/product';
import type { Variant } from '@/entities/stock/variant';
import type { BinsRepository } from '@/repositories/stock/bins-repository';
import type { ItemsRepository } from '@/repositories/stock/items-repository';
import type { ProductsRepository } from '@/repositories/stock/products-repository';
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
  entity: Item | Variant | Product | Bin;
}

export class LookupByCodeUseCase {
  constructor(
    private itemsRepository: ItemsRepository,
    private variantsRepository: VariantsRepository,
    private productsRepository: ProductsRepository,
    private binsRepository: BinsRepository,
  ) {}

  async execute(
    input: LookupByCodeUseCaseRequest,
  ): Promise<LookupByCodeUseCaseResponse> {
    const { tenantId, code } = input;

    // 1. Try pattern match
    if (ITEM_PATTERN.test(code)) {
      const item = await this.itemsRepository.findByFullCode(code, tenantId);
      if (item) {
        return { entityType: 'ITEM', entity: item };
      }
    }

    if (VARIANT_PATTERN.test(code)) {
      const variant = await this.variantsRepository.findByFullCode(
        code,
        tenantId,
      );
      if (variant) {
        return { entityType: 'VARIANT', entity: variant };
      }
    }

    if (PRODUCT_PATTERN.test(code)) {
      const product = await this.productsRepository.findByFullCode(
        code,
        tenantId,
      );
      if (product) {
        return { entityType: 'PRODUCT', entity: product };
      }
    }

    if (BIN_PATTERN.test(code)) {
      const bin = await this.binsRepository.findByAddress(code, tenantId);
      if (bin) {
        return { entityType: 'BIN', entity: bin };
      }
    }

    // 2. Fallback: try barcode, eanCode, upcCode lookup on items
    const itemByBarcode = await this.itemsRepository.findByBarcode(
      code,
      tenantId,
    );
    if (itemByBarcode) {
      return { entityType: 'ITEM', entity: itemByBarcode };
    }

    const itemByEan = await this.itemsRepository.findByEanCode(code, tenantId);
    if (itemByEan) {
      return { entityType: 'ITEM', entity: itemByEan };
    }

    const itemByUpc = await this.itemsRepository.findByUpcCode(code, tenantId);
    if (itemByUpc) {
      return { entityType: 'ITEM', entity: itemByUpc };
    }

    // 3. Nothing found
    throw new ResourceNotFoundError(`No entity found for code: ${code}`);
  }
}
