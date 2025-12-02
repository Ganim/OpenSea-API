import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { TimeBank } from '@/entities/hr/time-bank';
import { TimeBankRepository } from '@/repositories/hr/time-bank-repository';

export interface ListTimeBanksRequest {
  employeeId?: string;
  year?: number;
}

export interface ListTimeBanksResponse {
  timeBanks: TimeBank[];
  total: number;
}

export class ListTimeBanksUseCase {
  constructor(private timeBankRepository: TimeBankRepository) {}

  async execute(request: ListTimeBanksRequest): Promise<ListTimeBanksResponse> {
    const { employeeId, year } = request;

    let timeBanks: TimeBank[];

    if (employeeId) {
      timeBanks = await this.timeBankRepository.findManyByEmployee(
        new UniqueEntityID(employeeId),
      );
    } else if (year) {
      timeBanks = await this.timeBankRepository.findManyByYear(year);
    } else {
      // Default: current year
      timeBanks = await this.timeBankRepository.findManyByYear(
        new Date().getFullYear(),
      );
    }

    return {
      timeBanks,
      total: timeBanks.length,
    };
  }
}
