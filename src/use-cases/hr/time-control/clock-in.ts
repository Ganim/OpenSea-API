import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { TimeEntry } from '@/entities/hr/time-entry';
import { TimeEntryType } from '@/entities/hr/value-objects';
import { EmployeesRepository } from '@/repositories/hr/employees-repository';
import { GeofenceZonesRepository } from '@/repositories/hr/geofence-zones-repository';
import { PunchConfigRepository } from '@/repositories/hr/punch-config-repository';
import { TimeEntriesRepository } from '@/repositories/hr/time-entries-repository';
import { haversineDistance } from '@/use-cases/hr/geofence-zones/validate-geofence';

export interface ClockInRequest {
  tenantId: string;
  employeeId: string;
  timestamp?: Date;
  latitude?: number;
  longitude?: number;
  ipAddress?: string;
  notes?: string;
}

export interface ClockInResponse {
  timeEntry: TimeEntry;
  nsrNumber?: number;
}

export class ClockInUseCase {
  constructor(
    private timeEntriesRepository: TimeEntriesRepository,
    private employeesRepository: EmployeesRepository,
    private punchConfigRepository?: PunchConfigRepository,
    private geofenceZonesRepository?: GeofenceZonesRepository,
  ) {}

  async execute(request: ClockInRequest): Promise<ClockInResponse> {
    const {
      tenantId,
      employeeId,
      timestamp = new Date(),
      latitude,
      longitude,
      ipAddress,
      notes,
    } = request;

    // Verify employee exists
    const employee = await this.employeesRepository.findById(
      new UniqueEntityID(employeeId),
      tenantId,
    );
    if (!employee) {
      throw new ResourceNotFoundError('Employee not found');
    }

    // Verify employee is active
    if (!employee.status.isActive()) {
      throw new BadRequestError('Employee is not active');
    }

    // Check last entry to avoid duplicate clock in
    const lastEntry = await this.timeEntriesRepository.findLastEntryByEmployee(
      new UniqueEntityID(employeeId),
      tenantId,
    );

    if (lastEntry && lastEntry.entryType.isEntryType()) {
      throw new BadRequestError(
        'Employee has already clocked in. Please clock out first',
      );
    }

    // Load punch configuration and validate geofence if enabled
    if (this.punchConfigRepository && this.geofenceZonesRepository) {
      const punchConfig =
        await this.punchConfigRepository.findByTenantId(tenantId);

      if (punchConfig?.geofenceEnabled) {
        if (latitude == null || longitude == null) {
          throw new BadRequestError(
            'Location is required when geofence is enabled',
          );
        }

        const activeZones =
          await this.geofenceZonesRepository.findActiveByTenantId(tenantId);

        if (activeZones.length > 0) {
          let isWithin = false;
          for (const zone of activeZones) {
            const distance = haversineDistance(
              latitude,
              longitude,
              zone.latitude,
              zone.longitude,
            );
            if (distance <= zone.radiusMeters) {
              isWithin = true;
              break;
            }
          }

          if (!isWithin) {
            throw new BadRequestError(
              'Clock-in rejected: location is outside all allowed geofence zones',
            );
          }
        }
      }
    }

    // Auto-generate NSR atomically (retries on (tenantId, nsrNumber) collisions
    // — @@unique enforces Portaria 671's NSR uniqueness requirement).
    const timeEntry = await this.timeEntriesRepository.createWithSequentialNsr({
      tenantId,
      employeeId: new UniqueEntityID(employeeId),
      entryType: TimeEntryType.CLOCK_IN(),
      timestamp,
      latitude,
      longitude,
      ipAddress,
      notes,
    });

    const nsrNumber = await this.timeEntriesRepository.findMaxNsrNumber(
      tenantId,
    );

    return {
      timeEntry,
      nsrNumber,
    };
  }
}
