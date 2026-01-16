import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Bin } from '@/entities/stock/bin';
import type {
  BinsRepository,
  BinSearchFilters,
} from '@/repositories/stock/bins-repository';

interface ListBinsUseCaseRequest {
  zoneId?: string;
  aisle?: number;
  shelf?: number;
  isActive?: boolean;
  isBlocked?: boolean;
  isEmpty?: boolean;
  isFull?: boolean;
  addressPattern?: string;
}

interface ListBinsUseCaseResponse {
  bins: Bin[];
}

export class ListBinsUseCase {
  constructor(private binsRepository: BinsRepository) {}

  async execute(
    request: ListBinsUseCaseRequest = {},
  ): Promise<ListBinsUseCaseResponse> {
    const filters: BinSearchFilters = {};

    if (request.zoneId) filters.zoneId = new UniqueEntityID(request.zoneId);
    if (request.aisle !== undefined) filters.aisle = request.aisle;
    if (request.shelf !== undefined) filters.shelf = request.shelf;
    if (request.isActive !== undefined) filters.isActive = request.isActive;
    if (request.isBlocked !== undefined) filters.isBlocked = request.isBlocked;
    if (request.isEmpty !== undefined) filters.isEmpty = request.isEmpty;
    if (request.isFull !== undefined) filters.isFull = request.isFull;
    if (request.addressPattern) filters.addressPattern = request.addressPattern;

    const bins = await this.binsRepository.findMany(filters);

    return { bins };
  }
}
