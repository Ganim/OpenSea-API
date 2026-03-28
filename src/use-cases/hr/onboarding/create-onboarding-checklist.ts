import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  OnboardingChecklist,
  type OnboardingChecklistItem,
} from '@/entities/hr/onboarding-checklist';
import type { OnboardingChecklistsRepository } from '@/repositories/hr/onboarding-checklists-repository';
import { randomUUID } from 'node:crypto';

const DEFAULT_ONBOARDING_ITEMS: Omit<
  OnboardingChecklistItem,
  'id' | 'completed' | 'completedAt'
>[] = [
  {
    title: 'Complete personal information',
    description: 'Fill in your personal details in the HR system',
  },
  {
    title: 'Read company policies',
    description: 'Review the employee handbook and company policies',
  },
  {
    title: 'Set up workstation',
    description: 'Configure your computer, email, and required tools',
  },
  {
    title: 'Meet your team',
    description: 'Schedule introduction meetings with team members',
  },
  {
    title: 'Complete safety training',
    description: 'Watch safety orientation videos and sign acknowledgment',
  },
];

export interface CreateOnboardingChecklistInput {
  tenantId: string;
  employeeId: string;
  title?: string;
  items?: Omit<OnboardingChecklistItem, 'id' | 'completed' | 'completedAt'>[];
}

export interface CreateOnboardingChecklistOutput {
  checklist: OnboardingChecklist;
}

export class CreateOnboardingChecklistUseCase {
  constructor(
    private onboardingChecklistsRepository: OnboardingChecklistsRepository,
  ) {}

  async execute(
    input: CreateOnboardingChecklistInput,
  ): Promise<CreateOnboardingChecklistOutput> {
    const { tenantId, employeeId, title, items } = input;

    const existingChecklist =
      await this.onboardingChecklistsRepository.findByEmployeeId(
        new UniqueEntityID(employeeId),
        tenantId,
      );

    if (existingChecklist) {
      throw new BadRequestError(
        'Onboarding checklist already exists for this employee',
      );
    }

    const checklistItems: OnboardingChecklistItem[] = (
      items ?? DEFAULT_ONBOARDING_ITEMS
    ).map((item) => ({
      id: randomUUID(),
      title: item.title,
      description: item.description,
      completed: false,
    }));

    const checklist = OnboardingChecklist.create({
      tenantId: new UniqueEntityID(tenantId),
      employeeId: new UniqueEntityID(employeeId),
      title: title ?? 'Onboarding',
      items: checklistItems,
    });

    await this.onboardingChecklistsRepository.create(checklist);

    return { checklist };
  }
}
