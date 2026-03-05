import type { Card } from '@/entities/tasks/card';
import type { CardsRepository } from '@/repositories/tasks/cards-repository';

interface ListSubtasksRequest {
  tenantId: string;
  boardId: string;
  parentCardId: string;
}

interface ListSubtasksResponse {
  subtasks: Card[];
}

export class ListSubtasksUseCase {
  constructor(private cardsRepository: CardsRepository) {}

  async execute(request: ListSubtasksRequest): Promise<ListSubtasksResponse> {
    const subtasks = await this.cardsRepository.findSubtasks(request.parentCardId);

    return { subtasks };
  }
}
