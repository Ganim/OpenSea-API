import type { BinsRepository } from '@/repositories/stock/bins-repository';
import { ParseAddressUseCase } from './parse-address';

interface ValidateAddressUseCaseRequest {
  tenantId: string;
  address: string;
}

interface ValidateAddressUseCaseResponse {
  valid: boolean;
  exists: boolean;
  address: string;
  binId: string | null;
  error?: string;
}

export class ValidateAddressUseCase {
  constructor(private binsRepository: BinsRepository) {}

  async execute(
    input: ValidateAddressUseCaseRequest,
  ): Promise<ValidateAddressUseCaseResponse> {
    const { tenantId, address } = input;

    // First, parse the address to check if it's syntactically valid
    const parseUseCase = new ParseAddressUseCase();
    const parseResult = await parseUseCase.execute({ address });

    if (!parseResult.valid) {
      return {
        valid: false,
        exists: false,
        address,
        binId: null,
        error: parseResult.error,
      };
    }

    // Search for the bin with this address
    const bin = await this.binsRepository.findByAddress(
      address.trim().toUpperCase(),
      tenantId,
    );

    if (!bin) {
      return {
        valid: true,
        exists: false,
        address: parseResult.normalizedAddress || address,
        binId: null,
      };
    }

    return {
      valid: true,
      exists: true,
      address: bin.address,
      binId: bin.binId.toString(),
    };
  }
}
