import type { Bin } from '@/entities/stock/bin';
import type { BinsRepository } from '@/repositories/stock/bins-repository';

interface SearchBinsUseCaseRequest {
  query: string;
  limit?: number;
}

interface SearchBinsUseCaseResponse {
  bins: Bin[];
}

export class SearchBinsUseCase {
  constructor(private binsRepository: BinsRepository) {}

  async execute({
    query,
    limit = 20,
  }: SearchBinsUseCaseRequest): Promise<SearchBinsUseCaseResponse> {
    if (!query || query.trim().length === 0) {
      return { bins: [] };
    }

    const bins = await this.binsRepository.search(query.trim(), limit);

    return { bins };
  }
}
