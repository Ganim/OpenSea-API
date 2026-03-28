import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
  OffboardingChecklist,
  OffboardingChecklistItem,
} from '@/entities/hr/offboarding-checklist';
import type { OffboardingChecklistsRepository } from '@/repositories/hr/offboarding-checklists-repository';
import { randomUUID } from 'node:crypto';

export interface UpdateOffboardingChecklistInput {
  tenantId: string;
  id: string;
  title?: string;
  items?: Omit<OffboardingChecklistItem, 'id' | 'completed' | 'completedAt'>[];
}

export interface UpdateOffboardingChecklistOutput {
  checklist: OffboardingChecklist;
}

export class UpdateOffboardingChecklistUseCase {
  constructor(
    private offboardingChecklistsRepository: OffboardingChecklistsRepository,
  ) {}

  async execute(
    input: UpdateOffboardingChecklistInput,
  ): Promise<UpdateOffboardingChecklistOutput> {
    const { tenantId, id, title, items } = input;

    const checklist = await this.offboardingChecklistsRepository.findById(
      new UniqueEntityID(id),
      tenantId,
    );

    if (!checklist) {
      throw new ResourceNotFoundError('Offboarding checklist not found');
    }

    if (title !== undefined) {
      checklist.updateTitle(title);
    }

    if (items !== undefined) {
      // Preserve already-completed items, merge with new ones
      const existingItemsMap = new Map(
        checklist.items.map((existingItem) => [
          existingItem.title,
          existingItem,
        ]),
      );

      const mergedItems: OffboardingChecklistItem[] = items.map((newItem) => {
        const existing = existingItemsMap.get(newItem.title);
        if (existing) {
          return {
            ...existing,
            description: newItem.description,
          };
        }
        return {
          id: randomUUID(),
          title: newItem.title,
          description: newItem.description,
          completed: false,
        };
      });

      checklist.updateItems(mergedItems);
    }

    await this.offboardingChecklistsRepository.save(checklist);

    return { checklist };
  }
}
