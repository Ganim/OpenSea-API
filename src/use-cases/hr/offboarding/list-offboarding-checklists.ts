import type { OffboardingChecklist } from '@/entities/hr/offboarding-checklist';
import type { OffboardingChecklistsRepository } from '@/repositories/hr/offboarding-checklists-repository';

export interface ListOffboardingChecklistsInput {
  tenantId: string;
  page?: number;
  perPage?: number;
  employeeId?: string;
  status?: 'IN_PROGRESS' | 'COMPLETED';
  search?: string;
}

export interface ListOffboardingChecklistsOutput {
  checklists: OffboardingChecklist[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
}

export class ListOffboardingChecklistsUseCase {
  constructor(
    private offboardingChecklistsRepository: OffboardingChecklistsRepository,
  ) {}

  async execute(
    input: ListOffboardingChecklistsInput,
  ): Promise<ListOffboardingChecklistsOutput> {
    const {
      tenantId,
      page = 1,
      perPage = 20,
      employeeId,
      status,
      search,
    } = input;

    const { checklists, total } =
      await this.offboardingChecklistsRepository.findMany({
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
