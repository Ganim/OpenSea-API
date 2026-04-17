import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { PrismaGeofenceZonesRepository } from '@/repositories/hr/prisma/prisma-geofence-zones-repository';
import { PrismaPunchConfigRepository } from '@/repositories/hr/prisma/prisma-punch-config-repository';
import { PrismaTimeEntriesRepository } from '@/repositories/hr/prisma/prisma-time-entries-repository';
import { ClockOutUseCase } from '../clock-out';

export function makeClockOutUseCase(): ClockOutUseCase {
  const timeEntriesRepository = new PrismaTimeEntriesRepository();
  const employeesRepository = new PrismaEmployeesRepository();
  const punchConfigRepository = new PrismaPunchConfigRepository();
  const geofenceZonesRepository = new PrismaGeofenceZonesRepository();
  const useCase = new ClockOutUseCase(
    timeEntriesRepository,
    employeesRepository,
    punchConfigRepository,
    geofenceZonesRepository,
  );

  return useCase;
}
