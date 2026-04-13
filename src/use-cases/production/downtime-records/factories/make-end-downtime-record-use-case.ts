import { PrismaDowntimeRecordsRepository } from '@/repositories/production/prisma/prisma-downtime-records-repository';
import { EndDowntimeRecordUseCase } from '../end-downtime-record';

export function makeEndDowntimeRecordUseCase() {
  const downtimeRecordsRepository = new PrismaDowntimeRecordsRepository();
  const endDowntimeRecordUseCase = new EndDowntimeRecordUseCase(
    downtimeRecordsRepository,
  );
  return endDowntimeRecordUseCase;
}
