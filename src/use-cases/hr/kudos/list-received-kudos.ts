import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { EmployeeKudos } from '@/entities/hr/employee-kudos';
import type { EmployeeKudosRepository } from '@/repositories/hr/employee-kudos-repository';

export interface ListReceivedKudosInput {
  tenantId: string;
  employeeId: string;
  page: number;
  limit: number;
}

export interface ListReceivedKudosOutput {
  kudos: EmployeeKudos[];
  total: number;
}

export class ListReceivedKudosUseCase {
  constructor(private employeeKudosRepository: EmployeeKudosRepository) {}

  async execute(
    input: ListReceivedKudosInput,
  ): Promise<ListReceivedKudosOutput> {
    const { tenantId, employeeId, page, limit } = input;
    const skip = (page - 1) * limit;

    const { kudos, total } =
      await this.employeeKudosRepository.findManyByRecipient(
        new UniqueEntityID(employeeId),
        tenantId,
        skip,
        limit,
      );

    return { kudos, total };
  }
}
