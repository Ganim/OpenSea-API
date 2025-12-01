import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { EmployeesRepository } from '@/repositories/hr/employees-repository';
import { TimeEntriesRepository } from '@/repositories/hr/time-entries-repository';

export interface CalculateWorkedHoursRequest {
  employeeId: string;
  startDate: Date;
  endDate: Date;
}

export interface DailyHours {
  date: Date;
  workedHours: number;
  breakHours: number;
  overtimeHours: number;
  totalHours: number;
}

export interface CalculateWorkedHoursResponse {
  employeeId: string;
  startDate: Date;
  endDate: Date;
  dailyBreakdown: DailyHours[];
  totalWorkedHours: number;
  totalBreakHours: number;
  totalOvertimeHours: number;
  totalNetHours: number;
}

export class CalculateWorkedHoursUseCase {
  constructor(
    private timeEntriesRepository: TimeEntriesRepository,
    private employeesRepository: EmployeesRepository,
  ) {}

  async execute(
    request: CalculateWorkedHoursRequest,
  ): Promise<CalculateWorkedHoursResponse> {
    const { employeeId, startDate, endDate } = request;

    // Verify employee exists
    const employee = await this.employeesRepository.findById(
      new UniqueEntityID(employeeId),
    );
    if (!employee) {
      throw new Error('Employee not found');
    }

    // Fetch all time entries for the period
    const timeEntries =
      await this.timeEntriesRepository.findManyByEmployeeAndDateRange(
        new UniqueEntityID(employeeId),
        startDate,
        endDate,
      );

    // Group entries by date
    const entriesByDate = new Map<string, typeof timeEntries>();
    for (const entry of timeEntries) {
      const dateKey = entry.timestamp.toISOString().split('T')[0];
      if (!entriesByDate.has(dateKey)) {
        entriesByDate.set(dateKey, []);
      }
      entriesByDate.get(dateKey)!.push(entry);
    }

    // Calculate hours for each day
    const dailyBreakdown: DailyHours[] = [];
    let totalWorkedHours = 0;
    let totalBreakHours = 0;
    let totalOvertimeHours = 0;

    for (const [dateKey, entries] of entriesByDate) {
      const dayHours = this.calculateDayHours(entries);
      dailyBreakdown.push({
        date: new Date(dateKey),
        ...dayHours,
      });
      totalWorkedHours += dayHours.workedHours;
      totalBreakHours += dayHours.breakHours;
      totalOvertimeHours += dayHours.overtimeHours;
    }

    // Sort by date
    dailyBreakdown.sort((a, b) => a.date.getTime() - b.date.getTime());

    return {
      employeeId,
      startDate,
      endDate,
      dailyBreakdown,
      totalWorkedHours,
      totalBreakHours,
      totalOvertimeHours,
      totalNetHours: totalWorkedHours - totalBreakHours,
    };
  }

  private calculateDayHours(
    entries: Array<{
      timestamp: Date;
      entryType: { value: string };
    }>,
  ): Omit<DailyHours, 'date'> {
    let workedHours = 0;
    let breakHours = 0;
    let overtimeHours = 0;

    let clockInTime: Date | null = null;
    let breakStartTime: Date | null = null;
    let overtimeStartTime: Date | null = null;

    // Sort entries by timestamp
    const sortedEntries = [...entries].sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
    );

    for (const entry of sortedEntries) {
      const entryType = entry.entryType.value;

      switch (entryType) {
        case 'CLOCK_IN':
          clockInTime = entry.timestamp;
          break;
        case 'CLOCK_OUT':
          if (clockInTime) {
            workedHours += this.getHoursDifference(
              clockInTime,
              entry.timestamp,
            );
            clockInTime = null;
          }
          break;
        case 'BREAK_START':
          breakStartTime = entry.timestamp;
          break;
        case 'BREAK_END':
          if (breakStartTime) {
            breakHours += this.getHoursDifference(
              breakStartTime,
              entry.timestamp,
            );
            breakStartTime = null;
          }
          break;
        case 'OVERTIME_START':
          overtimeStartTime = entry.timestamp;
          break;
        case 'OVERTIME_END':
          if (overtimeStartTime) {
            overtimeHours += this.getHoursDifference(
              overtimeStartTime,
              entry.timestamp,
            );
            overtimeStartTime = null;
          }
          break;
      }
    }

    const totalHours = workedHours + overtimeHours - breakHours;

    return {
      workedHours: Math.round(workedHours * 100) / 100,
      breakHours: Math.round(breakHours * 100) / 100,
      overtimeHours: Math.round(overtimeHours * 100) / 100,
      totalHours: Math.round(totalHours * 100) / 100,
    };
  }

  private getHoursDifference(start: Date, end: Date): number {
    const diffMs = end.getTime() - start.getTime();
    return diffMs / (1000 * 60 * 60);
  }
}
