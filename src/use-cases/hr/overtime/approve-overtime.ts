import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Overtime } from '@/entities/hr/overtime';
import { OvertimeRepository } from '@/repositories/hr/overtime-repository';
import { TimeBankRepository } from '@/repositories/hr/time-bank-repository';

export interface ApproveOvertimeRequest {
  tenantId: string;
  overtimeId: string;
  approvedBy: string;
  addToTimeBank?: boolean;
}

export interface ApproveOvertimeResponse {
  overtime: Overtime;
}

export class ApproveOvertimeUseCase {
  constructor(
    private overtimeRepository: OvertimeRepository,
    private timeBankRepository: TimeBankRepository,
  ) {}

  async execute(
    request: ApproveOvertimeRequest,
  ): Promise<ApproveOvertimeResponse> {
    const { tenantId, overtimeId, approvedBy, addToTimeBank = false } = request;

    // Find overtime request
    const overtime = await this.overtimeRepository.findById(
      new UniqueEntityID(overtimeId),
      tenantId,
    );
    if (!overtime) {
      throw new Error('Overtime request not found');
    }

    // Check if already approved
    if (overtime.approved) {
      throw new Error('Overtime request is already approved');
    }

    // Approve overtime
    overtime.approve(new UniqueEntityID(approvedBy));
    await this.overtimeRepository.save(overtime);

    // Add to time bank if requested
    if (addToTimeBank) {
      const year = overtime.date.getFullYear();
      const timeBank = await this.timeBankRepository.findByEmployeeAndYear(
        overtime.employeeId,
        year,
        tenantId,
      );

      if (timeBank) {
        timeBank.credit(overtime.hours);
        await this.timeBankRepository.save(timeBank);
      } else {
        await this.timeBankRepository.create({
          tenantId,
          employeeId: overtime.employeeId,
          balance: overtime.hours,
          year,
        });
      }
    }

    return {
      overtime,
    };
  }
}
