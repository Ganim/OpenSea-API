import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Bin } from '@/entities/stock/bin';
import type { BinsRepository } from '@/repositories/stock/bins-repository';

interface UnblockBinUseCaseRequest {
  id: string;
}

interface UnblockBinUseCaseResponse {
  bin: Bin;
}

export class UnblockBinUseCase {
  constructor(private binsRepository: BinsRepository) {}

  async execute({
    id,
  }: UnblockBinUseCaseRequest): Promise<UnblockBinUseCaseResponse> {
    const binId = new UniqueEntityID(id);

    const bin = await this.binsRepository.findById(binId);

    if (!bin) {
      throw new ResourceNotFoundError('Bin');
    }

    if (!bin.isBlocked) {
      throw new BadRequestError('Bin is not blocked.');
    }

    bin.unblock();

    await this.binsRepository.save(bin);

    return { bin };
  }
}
