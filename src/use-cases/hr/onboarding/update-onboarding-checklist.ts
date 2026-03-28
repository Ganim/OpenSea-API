import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
  OnboardingChecklist,
  OnboardingChecklistItem,
} from '@/entities/hr/onboarding-checklist';
import type { OnboardingChecklistsRepository } from '@/repositories/hr/onboarding-checklists-repository';
import { randomUUID } from 'node:crypto';

export interface UpdateOnboardingChecklistInput {
  tenantId: string;
  id: string;
  title?: string;
  items?: Omit<OnboardingChecklistItem, 'id' | 'completed' | 'completedAt'>[];
}

export interface UpdateOnboardingChecklistOutput {
  checklist: OnboardingChecklist;
}

export class UpdateOnboardingChecklistUseCase {
  constructor(
    private onboardingChecklistsRepository: OnboardingChecklistsRepository,
  ) {}

  async execute(
    input: UpdateOnboardingChecklistInput,
  ): Promise<UpdateOnboardingChecklistOutput> {
    const { tenantId, id, title, items } = input;

    const checklist = await this.onboardingChecklistsRepository.findById(
      new UniqueEntityID(id),
      tenantId,
    );

    if (!checklist) {
      throw new ResourceNotFoundError('Onboarding checklist not found');
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

      const mergedItems: OnboardingChecklistItem[] = items.map((newItem) => {
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

    await this.onboardingChecklistsRepository.save(checklist);

    return { checklist };
  }
}
