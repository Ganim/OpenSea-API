import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { VariantsRepository } from '@/repositories/stock/variants-repository';

export interface GetVariantByIdUseCaseInput {
  id: string;
}

export interface GetVariantByIdUseCaseOutput {
  variant: {
    id: string;
    productId: string;
    sku: string;
    name: string;
    price: number;
    imageUrl?: string;
    attributes: Record<string, unknown>;
    costPrice?: number;
    profitMargin?: number;
    barcode?: string;
    qrCode?: string;
    eanCode?: string;
    upcCode?: string;
    minStock?: number;
    maxStock?: number;
    reorderPoint?: number;
    reorderQuantity?: number;
    createdAt: Date;
    updatedAt?: Date;
  };
}

export class GetVariantByIdUseCase {
  constructor(private variantsRepository: VariantsRepository) {}

  async execute(
    input: GetVariantByIdUseCaseInput,
  ): Promise<GetVariantByIdUseCaseOutput> {
    const variantId = new UniqueEntityID(input.id);
    const variant = await this.variantsRepository.findById(variantId);

    if (!variant) {
      throw new ResourceNotFoundError('Variant not found');
    }

    return {
      variant: {
        id: variant.id.toString(),
        productId: variant.productId.toString(),
        sku: variant.sku,
        name: variant.name,
        price: variant.price,
        imageUrl: variant.imageUrl,
        attributes: variant.attributes,
        costPrice: variant.costPrice,
        profitMargin: variant.profitMargin,
        barcode: variant.barcode,
        qrCode: variant.qrCode,
        eanCode: variant.eanCode,
        upcCode: variant.upcCode,
        minStock: variant.minStock,
        maxStock: variant.maxStock,
        reorderPoint: variant.reorderPoint,
        reorderQuantity: variant.reorderQuantity,
        createdAt: variant.createdAt,
        updatedAt: variant.updatedAt,
      },
    };
  }
}
