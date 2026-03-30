import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { MedicalExam } from '@/entities/hr/medical-exam';
import type { OccupationalExamRequirement } from '@/entities/hr/occupational-exam-requirement';
import { EmployeesRepository } from '@/repositories/hr/employees-repository';
import { MedicalExamsRepository } from '@/repositories/hr/medical-exams-repository';
import { OccupationalExamRequirementsRepository } from '@/repositories/hr/occupational-exam-requirements-repository';

export interface CheckEmployeeComplianceRequest {
  tenantId: string;
  employeeId: string;
}

export interface ComplianceItem {
  requirement: OccupationalExamRequirement;
  latestExam: MedicalExam | null;
  status: 'COMPLIANT' | 'EXPIRING' | 'OVERDUE' | 'MISSING';
  daysUntilExpiry: number | null;
}

export interface CheckEmployeeComplianceResponse {
  employeeId: string;
  complianceItems: ComplianceItem[];
  overallStatus: 'COMPLIANT' | 'NON_COMPLIANT';
  totalRequirements: number;
  compliantCount: number;
  expiringCount: number;
  overdueCount: number;
  missingCount: number;
}

export class CheckEmployeeComplianceUseCase {
  constructor(
    private employeesRepository: EmployeesRepository,
    private medicalExamsRepository: MedicalExamsRepository,
    private examRequirementsRepository: OccupationalExamRequirementsRepository,
  ) {}

  async execute(
    request: CheckEmployeeComplianceRequest,
  ): Promise<CheckEmployeeComplianceResponse> {
    const { tenantId, employeeId } = request;

    const employee = await this.employeesRepository.findById(
      new UniqueEntityID(employeeId),
      tenantId,
    );

    if (!employee) {
      throw new ResourceNotFoundError('Funcionário não encontrado');
    }

    // Get all requirements (global + position-specific)
    const globalRequirements = await this.examRequirementsRepository.findMany(
      tenantId,
      { positionId: undefined, perPage: 200 },
    );

    let positionRequirements: OccupationalExamRequirement[] = [];
    if (employee.positionId) {
      positionRequirements =
        await this.examRequirementsRepository.findByPositionId(
          employee.positionId,
          tenantId,
        );
    }

    // Combine global (no position) and position-specific requirements
    const allRequirements = [
      ...globalRequirements.filter((r) => !r.positionId),
      ...positionRequirements,
    ];

    // Get all exams for this employee
    const employeeExams = await this.medicalExamsRepository.findByEmployeeId(
      new UniqueEntityID(employeeId),
      tenantId,
    );

    const now = new Date();
    const thirtyDaysFromNow = new Date(now);
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    let compliantCount = 0;
    let expiringCount = 0;
    let overdueCount = 0;
    let missingCount = 0;

    const complianceItems: ComplianceItem[] = allRequirements.map(
      (requirement) => {
        // Find the latest exam matching this requirement type
        const matchingExams = employeeExams.filter(
          (exam) => exam.type === requirement.examType,
        );

        const latestExam =
          matchingExams.length > 0
            ? matchingExams.sort(
                (a, b) => b.examDate.getTime() - a.examDate.getTime(),
              )[0]
            : null;

        if (!latestExam) {
          missingCount++;
          return {
            requirement,
            latestExam: null,
            status: 'MISSING' as const,
            daysUntilExpiry: null,
          };
        }

        const expirationDate = latestExam.expirationDate;

        if (!expirationDate) {
          // No expiration = compliant by default
          compliantCount++;
          return {
            requirement,
            latestExam,
            status: 'COMPLIANT' as const,
            daysUntilExpiry: null,
          };
        }

        const daysUntilExpiry = Math.ceil(
          (expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        );

        if (expirationDate < now) {
          overdueCount++;
          return {
            requirement,
            latestExam,
            status: 'OVERDUE' as const,
            daysUntilExpiry,
          };
        }

        if (expirationDate <= thirtyDaysFromNow) {
          expiringCount++;
          return {
            requirement,
            latestExam,
            status: 'EXPIRING' as const,
            daysUntilExpiry,
          };
        }

        compliantCount++;
        return {
          requirement,
          latestExam,
          status: 'COMPLIANT' as const,
          daysUntilExpiry,
        };
      },
    );

    const overallStatus =
      overdueCount > 0 || missingCount > 0 ? 'NON_COMPLIANT' : 'COMPLIANT';

    return {
      employeeId,
      complianceItems,
      overallStatus,
      totalRequirements: allRequirements.length,
      compliantCount,
      expiringCount,
      overdueCount,
      missingCount,
    };
  }
}
