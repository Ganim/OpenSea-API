import type { OnboardingChecklist } from '@/entities/hr/onboarding-checklist';
import type { OnboardingChecklistsRepository } from '@/repositories/hr/onboarding-checklists-repository';

export interface ListOnboardingChecklistsInput {
  tenantId: string;
  page?: number;
  perPage?: number;
  employeeId?: string;
  status?: 'IN_PROGRESS' | 'COMPLETED';
  search?: string;
}

export interface ListOnboardingChecklistsOutput {
  checklists: OnboardingChecklist[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
}

export class ListOnboardingChecklistsUseCase {
  constructor(
    private onboardingChecklistsRepository: OnboardingChecklistsRepository,
  ) {}

  async execute(
    input: ListOnboardingChecklistsInput,
  ): Promise<ListOnboardingChecklistsOutput> {
    const {
      tenantId,
      page = 1,
      perPage = 20,
      employeeId,
      status,
      search,
    } = input;

    const { checklists, total } =
      await this.onboardingChecklistsRepository.findMany({
        tenantId,
        page,
        perPage,
        employeeId,
        status,
        search,
      });

    const totalPages = Math.ceil(total / perPage);

    return {
      checklists,
      meta: {
        total,
        page,
        perPage,
        totalPages,
      },
    };
  }
}
