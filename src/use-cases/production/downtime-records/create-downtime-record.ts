import { DowntimeRecordsRepository } from '@/repositories/production/downtime-records-repository';

interface CreateDowntimeRecordUseCaseRequest {
  workstationId: string;
  downtimeReasonId: string;
  startTime: Date;
  endTime?: Date;
  reportedById: string;
  notes?: string;
}

interface CreateDowntimeRecordUseCaseResponse {
  downtimeRecord: import('@/entities/production/downtime-record').ProductionDowntimeRecord;
}

export class CreateDowntimeRecordUseCase {
  constructor(private downtimeRecordsRepository: DowntimeRecordsRepository) {}

  async execute({
    workstationId,
    downtimeReasonId,
    startTime,
    endTime,
    reportedById,
    notes,
  }: CreateDowntimeRecordUseCaseRequest): Promise<CreateDowntimeRecordUseCaseResponse> {
    let durationMinutes: number | undefined;

    if (endTime) {
      durationMinutes = Math.ceil(
        (endTime.getTime() - startTime.getTime()) / 60000,
      );
    }

    const downtimeRecord = await this.downtimeRecordsRepository.create({
      workstationId,
      downtimeReasonId,
      startTime,
      endTime,
      durationMinutes,
      reportedById,
      notes,
    });

    return { downtimeRecord };
  }
}
