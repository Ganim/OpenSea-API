import type { EmployeeKudos } from '@/entities/hr/employee-kudos';
import type { EmployeeKudosRepository } from '@/repositories/hr/employee-kudos-repository';

export interface ListKudosFeedInput {
  tenantId: string;
  page: number;
  limit: number;
}

export interface ListKudosFeedOutput {
  kudos: EmployeeKudos[];
  total: number;
}

export class ListKudosFeedUseCase {
  constructor(private employeeKudosRepository: EmployeeKudosRepository) {}

  async execute(input: ListKudosFeedInput): Promise<ListKudosFeedOutput> {
    const { tenantId, page, limit } = input;
    const skip = (page - 1) * limit;

    const { kudos, total } =
      await this.employeeKudosRepository.findManyPublicFeed(
        tenantId,
        skip,
        limit,
      );

    return { kudos, total };
  }
}
