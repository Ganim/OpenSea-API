import { PrismaDowntimeRecordsRepository } from '@/repositories/production/prisma/prisma-downtime-records-repository';
import { ListDowntimeRecordsUseCase } from '../list-downtime-records';

export function makeListDowntimeRecordsUseCase() {
  const downtimeRecordsRepository = new PrismaDowntimeRecordsRepository();
  const listDowntimeRecordsUseCase = new ListDowntimeRecordsUseCase(
    downtimeRecordsRepository,
  );
  return listDowntimeRecordsUseCase;
}
