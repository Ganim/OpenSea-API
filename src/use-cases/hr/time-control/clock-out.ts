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

export interface ClockOutRequest {
  tenantId: string;
  employeeId: string;
  timestamp?: Date;
  latitude?: number;
  longitude?: number;
  ipAddress?: string;
  notes?: string;
}

export interface ClockOutResponse {
  timeEntry: TimeEntry;
}

/**
 * @deprecated Use `ExecutePunchUseCase` via `POST /v1/hr/punch/clock`
 * (Plan 04-04). This legacy use case is preserved only for backward
 * compatibility with clients still calling `POST /v1/hr/time-control/clock-out`.
 *
 * Scheduled for removal in phase 6 or 7 when all kiosk/PWA clients
 * migrate to the unified endpoint.
 *
 * Do NOT add new features here — extend `ExecutePunchUseCase` and the
 * `PunchValidationPipeline` instead (AD-03: legacy path stays frozen
 * to avoid behavior drift vs the canonical path).
 */
export class ClockOutUseCase {
  constructor(
    private timeEntriesRepository: TimeEntriesRepository,
    private employeesRepository: EmployeesRepository,
    private punchConfigRepository?: PunchConfigRepository,
    private geofenceZonesRepository?: GeofenceZonesRepository,
  ) {}

  async execute(request: ClockOutRequest): Promise<ClockOutResponse> {
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

    // Check last entry to ensure employee has clocked in
    const lastEntry = await this.timeEntriesRepository.findLastEntryByEmployee(
      new UniqueEntityID(employeeId),
      tenantId,
    );

    if (!lastEntry || lastEntry.entryType.isExitType()) {
      throw new BadRequestError(
        'Employee has not clocked in. Please clock in first',
      );
    }

    // Mirror the clock-in geofence check (P0 safety): without this the
    // perimeter enforcement was half-open — an employee could punch out from
    // anywhere, which breaks the audit story for geofenced jobsites and
    // silently invalidates the clock-in's location proof.
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
              'Clock-out rejected: location is outside all allowed geofence zones',
            );
          }
        }
      }
    }

    // Create clock out entry with sequential NSR (Portaria 671 requires a
    // unique NSR per punch, including clock-outs — previously skipped here).
    const { timeEntry } =
      await this.timeEntriesRepository.createWithSequentialNsr({
        tenantId,
        employeeId: new UniqueEntityID(employeeId),
        entryType: TimeEntryType.CLOCK_OUT(),
        timestamp,
        latitude,
        longitude,
        ipAddress,
        notes,
      });

    return {
      timeEntry,
    };
  }
}
