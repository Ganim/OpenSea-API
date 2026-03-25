import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { PrismaGeofenceZonesRepository } from '@/repositories/hr/prisma/prisma-geofence-zones-repository';
import { PrismaPunchConfigRepository } from '@/repositories/hr/prisma/prisma-punch-config-repository';
import { PrismaTimeEntriesRepository } from '@/repositories/hr/prisma/prisma-time-entries-repository';
import { ClockInUseCase } from '../clock-in';

export function makeClockInUseCase(): ClockInUseCase {
  const timeEntriesRepository = new PrismaTimeEntriesRepository();
  const employeesRepository = new PrismaEmployeesRepository();
  const punchConfigRepository = new PrismaPunchConfigRepository();
  const geofenceZonesRepository = new PrismaGeofenceZonesRepository();
  const useCase = new ClockInUseCase(
    timeEntriesRepository,
    employeesRepository,
    punchConfigRepository,
    geofenceZonesRepository,
  );

  return useCase;
}
