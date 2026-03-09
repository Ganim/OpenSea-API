import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import {
  type BoardDTO,
  type BoardColumnDTO,
  boardToDTO,
} from '@/mappers/tasks/board/board-to-dto';
import type { BoardColumnsRepository } from '@/repositories/tasks/board-columns-repository';
import type { BoardsRepository } from '@/repositories/tasks/boards-repository';

interface CreateBoardRequest {
  tenantId: string;
  userId: string;
  title: string;
  description?: string | null;
  type?: string;
  teamId?: string | null;
  visibility?: string;
  defaultView?: string;
  settings?: Record<string, unknown> | null;
  gradientId?: string | null;
}

interface CreateBoardResponse {
  board: BoardDTO;
}

const DEFAULT_COLUMNS = [
  { title: 'A Fazer', position: 0, isDefault: true, isDone: false },
  { title: 'Em Progresso', position: 1, isDefault: false, isDone: false },
  { title: 'Concluído', position: 2, isDefault: false, isDone: true },
] as const;

export class CreateBoardUseCase {
  constructor(
    private boardsRepository: BoardsRepository,
    private boardColumnsRepository: BoardColumnsRepository,
  ) {}

  async execute(request: CreateBoardRequest): Promise<CreateBoardResponse> {
    const { tenantId, userId, title, type, teamId } = request;

    if (!title || title.trim().length === 0) {
      throw new BadRequestError('Board title is required');
    }

    if (title.length > 256) {
      throw new BadRequestError(
        'Board title must be at most 256 characters',
      );
    }

    const boardType = type ?? 'PERSONAL';

    if (boardType === 'TEAM' && !teamId) {
      throw new BadRequestError(
        'Team ID is required for team boards',
      );
    }

    if (boardType === 'PERSONAL' && teamId) {
      throw new BadRequestError(
        'Personal boards cannot have a team ID',
      );
    }

    const board = await this.boardsRepository.create({
      tenantId,
      title: title.trim(),
      description: request.description,
      type: boardType,
      teamId: boardType === 'TEAM' ? teamId : null,
      ownerId: userId,
      visibility: request.visibility,
      defaultView: request.defaultView,
      settings: request.settings,
      gradientId: request.gradientId,
    });

    const boardId = board.id.toString();

    const columns = await this.boardColumnsRepository.createMany(
      DEFAULT_COLUMNS.map((columnDef) => ({
        boardId,
        title: columnDef.title,
        position: columnDef.position,
        isDefault: columnDef.isDefault,
        isDone: columnDef.isDone,
      })),
    );

    const createdColumns: BoardColumnDTO[] = columns.map((column) => ({
      id: column.id,
      boardId: column.boardId,
      title: column.title,
      color: column.color,
      position: column.position,
      isDefault: column.isDefault,
      isDone: column.isDone,
      wipLimit: column.wipLimit,
      archivedAt: column.archivedAt,
      createdAt: column.createdAt,
    }));

    return { board: boardToDTO(board, { columns: createdColumns }) };
  }
}
