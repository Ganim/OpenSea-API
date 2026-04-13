import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { ProductionDowntimeRecord } from '@/entities/production/downtime-record';
import { DowntimeRecordsRepository } from '@/repositories/production/downtime-records-repository';

interface ListDowntimeRecordsUseCaseRequest {
  workstationId: string;
  startDate?: Date;
  endDate?: Date;
}

interface ListDowntimeRecordsUseCaseResponse {
  downtimeRecords: ProductionDowntimeRecord[];
}

export class ListDowntimeRecordsUseCase {
  constructor(private downtimeRecordsRepository: DowntimeRecordsRepository) {}

  async execute({
    workstationId,
    startDate,
    endDate,
  }: ListDowntimeRecordsUseCaseRequest): Promise<ListDowntimeRecordsUseCaseResponse> {
    const downtimeRecords =
      await this.downtimeRecordsRepository.findManyByWorkstationId(
        new UniqueEntityID(workstationId),
        startDate,
        endDate,
      );

    return { downtimeRecords };
  }
}
