import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
  BinsRepository,
  BinOccupancyData,
} from '@/repositories/stock/bins-repository';
import type { ZonesRepository } from '@/repositories/stock/zones-repository';

interface GetBinOccupancyMapUseCaseRequest {
  tenantId: string;
  zoneId: string;
}

interface GetBinOccupancyMapUseCaseResponse {
  occupancyData: BinOccupancyData[];
  stats: {
    totalBins: number;
    emptyBins: number;
    partialBins: number;
    fullBins: number;
    blockedBins: number;
  };
}

export class GetBinOccupancyMapUseCase {
  constructor(
    private binsRepository: BinsRepository,
    private zonesRepository: ZonesRepository,
  ) {}

  async execute({
    tenantId,
    zoneId,
  }: GetBinOccupancyMapUseCaseRequest): Promise<GetBinOccupancyMapUseCaseResponse> {
    const zoneEntityId = new UniqueEntityID(zoneId);

    // Check if zone exists
    const zone = await this.zonesRepository.findById(zoneEntityId, tenantId);

    if (!zone) {
      throw new ResourceNotFoundError('Zone');
    }

    const occupancyData = await this.binsRepository.getOccupancyMap(
      zoneEntityId,
      tenantId,
    );

    // Calculate stats
    let emptyBins = 0;
    let partialBins = 0;
    let fullBins = 0;
    let blockedBins = 0;

    for (const bin of occupancyData) {
      if (bin.isBlocked) {
        blockedBins++;
      } else if (bin.currentOccupancy === 0) {
        emptyBins++;
      } else if (
        bin.capacity !== null &&
        bin.currentOccupancy >= bin.capacity
      ) {
        fullBins++;
      } else {
        partialBins++;
      }
    }

    return {
      occupancyData,
      stats: {
        totalBins: occupancyData.length,
        emptyBins,
        partialBins,
        fullBins,
        blockedBins,
      },
    };
  }
}
