import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { MedicalExam } from '@/entities/hr/medical-exam';
import { EmployeesRepository } from '@/repositories/hr/employees-repository';
import { MedicalExamsRepository } from '@/repositories/hr/medical-exams-repository';

export interface CreateMedicalExamRequest {
  tenantId: string;
  employeeId: string;
  type: string;
  examDate: Date;
  expirationDate?: Date;
  doctorName: string;
  doctorCrm: string;
  result: string;
  observations?: string;
  documentUrl?: string;
}

export interface CreateMedicalExamResponse {
  medicalExam: MedicalExam;
}

export class CreateMedicalExamUseCase {
  constructor(
    private medicalExamsRepository: MedicalExamsRepository,
    private employeesRepository: EmployeesRepository,
  ) {}

  async execute(
    request: CreateMedicalExamRequest,
  ): Promise<CreateMedicalExamResponse> {
    const {
      tenantId,
      employeeId,
      type,
      examDate,
      expirationDate,
      doctorName,
      doctorCrm,
      result,
      observations,
      documentUrl,
    } = request;

    if (!doctorName || doctorName.trim().length === 0) {
      throw new BadRequestError('O nome do médico é obrigatório');
    }

    if (!doctorCrm || doctorCrm.trim().length === 0) {
      throw new BadRequestError('O CRM do médico é obrigatório');
    }

    // Verify employee exists
    const employee = await this.employeesRepository.findById(
      new UniqueEntityID(employeeId),
      tenantId,
    );

    if (!employee) {
      throw new ResourceNotFoundError('Funcionário não encontrado');
    }

    const medicalExam = await this.medicalExamsRepository.create({
      tenantId,
      employeeId: new UniqueEntityID(employeeId),
      type,
      examDate,
      expirationDate,
      doctorName: doctorName.trim(),
      doctorCrm: doctorCrm.trim(),
      result,
      observations: observations?.trim(),
      documentUrl,
    });

    // Auto-generate eSocial S-2220 (Medical Exam / ASO) event — non-blocking
    import('@/services/esocial/auto-generate').then(({ tryAutoGenerateEvent }) =>
      tryAutoGenerateEvent({
        tenantId,
        eventType: 'S-2220',
        referenceType: 'MEDICAL_EXAM',
        referenceId: medicalExam.id.toString(),
      }),
    );

    return { medicalExam };
  }
}
