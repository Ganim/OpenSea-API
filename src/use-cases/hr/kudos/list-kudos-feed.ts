import type { EmployeeKudos } from '@/entities/hr/employee-kudos';
import type { EmployeeKudosRepository } from '@/repositories/hr/employee-kudos-repository';
import type {
  KudosReactionSummaryItem,
  KudosReactionsRepository,
} from '@/repositories/hr/kudos-reactions-repository';
import type { KudosRepliesRepository } from '@/repositories/hr/kudos-replies-repository';

export interface ListKudosFeedInput {
  tenantId: string;
  page: number;
  limit: number;
  pinned?: boolean;
}

export interface KudosFeedItem {
  kudos: EmployeeKudos;
  reactionsSummary: KudosReactionSummaryItem[];
  repliesCount: number;
}

export interface ListKudosFeedOutput {
  items: KudosFeedItem[];
  total: number;
}

export class ListKudosFeedUseCase {
  constructor(
    private readonly employeeKudosRepository: EmployeeKudosRepository,
    private readonly kudosReactionsRepository?: KudosReactionsRepository,
    private readonly kudosRepliesRepository?: KudosRepliesRepository,
  ) {}

  async execute(input: ListKudosFeedInput): Promise<ListKudosFeedOutput> {
    const { tenantId, page, limit, pinned } = input;
    const skip = (page - 1) * limit;

    const { kudos, total } =
      await this.employeeKudosRepository.findManyPublicFeed(
        tenantId,
        skip,
        limit,
        pinned !== undefined ? { pinned } : undefined,
      );

    const kudosIds = kudos.map((item) => item.id.toString());

    const reactionsSummaryByKudos = this.kudosReactionsRepository
      ? await this.kudosReactionsRepository.summarizeForKudosIds(kudosIds)
      : {};

    const repliesCountByKudos = this.kudosRepliesRepository
      ? await this.kudosRepliesRepository.countActiveForKudosIds(kudosIds)
      : {};

    const items: KudosFeedItem[] = kudos.map((kudosItem) => {
      const id = kudosItem.id.toString();
      return {
        kudos: kudosItem,
        reactionsSummary: reactionsSummaryByKudos[id] ?? [],
        repliesCount: repliesCountByKudos[id] ?? 0,
      };
    });

    return { items, total };
  }
}
