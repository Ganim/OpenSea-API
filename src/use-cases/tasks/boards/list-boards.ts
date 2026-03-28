import { type BoardDTO, boardToDTO } from '@/mappers/tasks/board/board-to-dto';
import type { BoardsRepository } from '@/repositories/tasks/boards-repository';

interface ListBoardsRequest {
  tenantId: string;
  userId: string;
  type?: string;
  teamId?: string;
  search?: string;
  includeArchived?: boolean;
  page?: number;
  limit?: number;
}

interface ListBoardsResponse {
  boards: BoardDTO[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export class ListBoardsUseCase {
  constructor(private boardsRepository: BoardsRepository) {}

  async execute(request: ListBoardsRequest): Promise<ListBoardsResponse> {
    const { tenantId, userId, type, teamId, search, includeArchived } = request;
    const page = request.page ?? 1;
    const limit = Math.min(request.limit ?? 20, 100);

    const { boards, total } = await this.boardsRepository.findMany({
      tenantId,
      userId,
      type,
      teamId,
      search,
      includeArchived,
      page,
      limit,
    });

    const boardDTOs = boards.map((board) => boardToDTO(board));

    return {
      boards: boardDTOs,
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }
}
