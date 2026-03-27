import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { EmployeeKudos } from '@/entities/hr/employee-kudos';
import type { EmployeeKudosRepository } from '@/repositories/hr/employee-kudos-repository';

export interface ListSentKudosInput {
  tenantId: string;
  employeeId: string;
  page: number;
  limit: number;
}

export interface ListSentKudosOutput {
  kudos: EmployeeKudos[];
  total: number;
}

export class ListSentKudosUseCase {
  constructor(private employeeKudosRepository: EmployeeKudosRepository) {}

  async execute(input: ListSentKudosInput): Promise<ListSentKudosOutput> {
    const { tenantId, employeeId, page, limit } = input;
    const skip = (page - 1) * limit;

    const { kudos, total } =
      await this.employeeKudosRepository.findManyBySender(
        new UniqueEntityID(employeeId),
        tenantId,
        skip,
        limit,
      );

    return { kudos, total };
  }
}
