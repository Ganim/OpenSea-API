import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { Bin } from '@/entities/stock/bin';
import type { BinsRepository } from '@/repositories/stock/bins-repository';

interface GetBinByAddressUseCaseRequest {
  address: string;
}

interface GetBinByAddressUseCaseResponse {
  bin: Bin;
  itemCount: number;
}

export class GetBinByAddressUseCase {
  constructor(private binsRepository: BinsRepository) {}

  async execute({
    address,
  }: GetBinByAddressUseCaseRequest): Promise<GetBinByAddressUseCaseResponse> {
    const bin = await this.binsRepository.findByAddress(address);

    if (!bin) {
      throw new ResourceNotFoundError('Bin');
    }

    const itemCount = await this.binsRepository.countItemsInBin(bin.binId);

    return { bin, itemCount };
  }
}
