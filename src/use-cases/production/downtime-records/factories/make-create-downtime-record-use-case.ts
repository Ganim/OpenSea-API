import { PrismaDowntimeRecordsRepository } from '@/repositories/production/prisma/prisma-downtime-records-repository';
import { CreateDowntimeRecordUseCase } from '../create-downtime-record';

export function makeCreateDowntimeRecordUseCase() {
  const downtimeRecordsRepository = new PrismaDowntimeRecordsRepository();
  const createDowntimeRecordUseCase = new CreateDowntimeRecordUseCase(
    downtimeRecordsRepository,
  );
  return createDowntimeRecordUseCase;
}
