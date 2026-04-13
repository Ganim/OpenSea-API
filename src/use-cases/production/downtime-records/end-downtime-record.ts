import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { ProductionDowntimeRecord } from '@/entities/production/downtime-record';
import { DowntimeRecordsRepository } from '@/repositories/production/downtime-records-repository';

interface EndDowntimeRecordUseCaseRequest {
  id: string;
  endTime?: Date;
}

interface EndDowntimeRecordUseCaseResponse {
  downtimeRecord: ProductionDowntimeRecord;
}

export class EndDowntimeRecordUseCase {
  constructor(private downtimeRecordsRepository: DowntimeRecordsRepository) {}

  async execute({
    id,
    endTime,
  }: EndDowntimeRecordUseCaseRequest): Promise<EndDowntimeRecordUseCaseResponse> {
    const downtimeRecord = await this.downtimeRecordsRepository.findById(
      new UniqueEntityID(id),
    );

    if (!downtimeRecord) {
      throw new ResourceNotFoundError('Downtime record not found.');
    }

    if (downtimeRecord.endTime) {
      throw new BadRequestError(
        'This downtime record has already been ended.',
      );
    }

    const resolvedEndTime = endTime ?? new Date();
    downtimeRecord.end(resolvedEndTime);

    const updated = await this.downtimeRecordsRepository.update({
      id: downtimeRecord.downtimeRecordId,
      endTime: downtimeRecord.endTime,
      durationMinutes: downtimeRecord.durationMinutes,
    });

    return { downtimeRecord: updated! };
  }
}
