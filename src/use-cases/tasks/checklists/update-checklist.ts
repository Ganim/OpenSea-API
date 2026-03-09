import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type {
  CardChecklistRecord,
  CardChecklistsRepository,
} from '@/repositories/tasks/card-checklists-repository';

interface UpdateChecklistRequest {
  tenantId: string;
  userId: string;
  boardId: string;
  cardId: string;
  checklistId: string;
  title: string;
}

interface UpdateChecklistResponse {
  checklist: CardChecklistRecord;
}

export class UpdateChecklistUseCase {
  constructor(private cardChecklistsRepository: CardChecklistsRepository) {}

  async execute(
    request: UpdateChecklistRequest,
  ): Promise<UpdateChecklistResponse> {
    const { cardId, checklistId, title } = request;

    const checklist = await this.cardChecklistsRepository.update({
      id: checklistId,
      cardId,
      title: title.trim(),
    });

    if (!checklist) {
      throw new ResourceNotFoundError('Checklist not found');
    }

    return { checklist };
  }
}
