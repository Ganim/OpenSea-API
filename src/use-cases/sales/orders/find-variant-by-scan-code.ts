import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { Variant } from '@/entities/stock/variant';
import type { VariantsRepository } from '@/repositories/stock/variants-repository';

interface FindVariantByScanCodeUseCaseRequest {
  tenantId: string;
  code: string;
}

interface FindVariantByScanCodeUseCaseResponse {
  variant: Variant;
  matchedBy: 'barcode' | 'ean' | 'upc' | 'sku';
}

export class FindVariantByScanCodeUseCase {
  constructor(private variantsRepository: VariantsRepository) {}

  async execute(
    input: FindVariantByScanCodeUseCaseRequest,
  ): Promise<FindVariantByScanCodeUseCaseResponse> {
    const normalizedCode = input.code.trim();

    if (!normalizedCode) {
      throw new BadRequestError('Scan code is required.');
    }

    const lookups: Array<
      readonly [
        'barcode' | 'ean' | 'upc' | 'sku',
        (code: string, tenantId: string) => Promise<Variant | null>,
      ]
    > = [
      [
        'barcode',
        (code, tenantId) =>
          this.variantsRepository.findByBarcode(code, tenantId),
      ],
      [
        'ean',
        (code, tenantId) =>
          this.variantsRepository.findByEANCode(code, tenantId),
      ],
      [
        'upc',
        (code, tenantId) =>
          this.variantsRepository.findByUPCCode(code, tenantId),
      ],
      [
        'sku',
        (code, tenantId) => this.variantsRepository.findBySKU(code, tenantId),
      ],
    ];

    for (const [matchedBy, lookup] of lookups) {
      const variant = await lookup(normalizedCode, input.tenantId);

      if (variant) {
        if (!variant.isActive) {
          throw new BadRequestError('Scanned variant is inactive.');
        }

        return { variant, matchedBy };
      }
    }

    throw new ResourceNotFoundError('Variant not found for scanned code.');
  }
}
