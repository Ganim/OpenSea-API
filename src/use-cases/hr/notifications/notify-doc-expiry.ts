import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Employee } from '@/entities/hr/employee';
import type { EmployeesRepository } from '@/repositories/hr/employees-repository';
import type { MedicalExamsRepository } from '@/repositories/hr/medical-exams-repository';
import type { TrainingEnrollmentsRepository } from '@/repositories/hr/training-enrollments-repository';
import type { TrainingProgramsRepository } from '@/repositories/hr/training-programs-repository';
import type { CreateNotificationUseCase } from '@/use-cases/notifications/create-notification';

const DEFAULT_LOOKAHEAD_DAYS = 30;

export interface NotifyDocExpiryRequest {
  tenantId: string;
  /**
   * Reference date used as "today". Defaults to now — can be overridden in tests.
   */
  referenceDate?: Date;
  /** Window (in days) used to look ahead for expirations. Defaults to 30. */
  lookaheadDays?: number;
}

export interface NotifyDocExpiryResponse {
  scannedMedicalExams: number;
  scannedTrainings: number;
  notificationsCreated: number;
}

interface ExpiringItem {
  kind: 'medicalExam' | 'training';
  entityId: string;
  employeeId: string;
  expirationDate: Date;
  description: string;
}

/**
 * Scans HR-related documents (medical exams + training enrollments) for items
 * expiring within the next {@link DEFAULT_LOOKAHEAD_DAYS} days and emits one
 * in-app notification per item to the responsible user (the employee's
 * supervisor when available, falling back to the employee themselves).
 *
 * Idempotent at the notification layer — {@link CreateNotificationUseCase}
 * de-duplicates on (userId + entityType + entityId).
 */
export class NotifyDocExpiryUseCase {
  constructor(
    private readonly employeesRepository: EmployeesRepository,
    private readonly medicalExamsRepository: MedicalExamsRepository,
    private readonly trainingEnrollmentsRepository: TrainingEnrollmentsRepository,
    private readonly trainingProgramsRepository: TrainingProgramsRepository,
    private readonly createNotificationUseCase: CreateNotificationUseCase,
  ) {}

  async execute(
    request: NotifyDocExpiryRequest,
  ): Promise<NotifyDocExpiryResponse> {
    const { tenantId } = request;
    const lookaheadDays = request.lookaheadDays ?? DEFAULT_LOOKAHEAD_DAYS;

    const expiringMedicalExams = await this.medicalExamsRepository.findExpiring(
      tenantId,
      lookaheadDays,
    );

    const expiringTrainings = await this.collectExpiringTrainings(
      tenantId,
      request.referenceDate ?? new Date(),
      lookaheadDays,
    );

    const expiringItems: ExpiringItem[] = [
      ...expiringMedicalExams.map(
        (medicalExam): ExpiringItem => ({
          kind: 'medicalExam',
          entityId: medicalExam.id.toString(),
          employeeId: medicalExam.employeeId.toString(),
          expirationDate: medicalExam.expirationDate as Date,
          description: medicalExam.type,
        }),
      ),
      ...expiringTrainings,
    ];

    let notificationsCreated = 0;

    for (const expiringItem of expiringItems) {
      const responsibleUserId = await this.resolveResponsibleUserId(
        expiringItem.employeeId,
        tenantId,
      );

      if (!responsibleUserId) {
        continue;
      }

      const notificationPayload = buildNotificationPayload(expiringItem);

      await this.createNotificationUseCase.execute({
        userId: responsibleUserId,
        title: notificationPayload.title,
        message: notificationPayload.message,
        type: 'WARNING',
        priority: 'HIGH',
        channel: 'IN_APP',
        entityType: notificationPayload.entityType,
        entityId: expiringItem.entityId,
        actionUrl: notificationPayload.actionUrl,
        actionText: 'Ver detalhes',
        metadata: {
          employeeId: expiringItem.employeeId,
          expirationDate: expiringItem.expirationDate.toISOString(),
        },
      });

      notificationsCreated++;
    }

    return {
      scannedMedicalExams: expiringMedicalExams.length,
      scannedTrainings: expiringTrainings.length,
      notificationsCreated,
    };
  }

  /**
   * Collects training enrollments whose certification will expire within the
   * lookahead window. Expiration is derived from the program's
   * {@link TrainingProgram.validityMonths} applied to the
   * {@link TrainingEnrollment.completedAt} timestamp.
   */
  private async collectExpiringTrainings(
    tenantId: string,
    referenceDate: Date,
    lookaheadDays: number,
  ): Promise<ExpiringItem[]> {
    const upperBound = new Date(referenceDate);
    upperBound.setDate(upperBound.getDate() + lookaheadDays);

    const completedTrainings = await this.trainingEnrollmentsRepository.findMany(
      tenantId,
      { status: 'COMPLETED', perPage: 1000 },
    );

    const programCache = new Map<
      string,
      { name: string; validityMonths: number | null }
    >();

    const expiringTrainings: ExpiringItem[] = [];

    for (const enrollment of completedTrainings.enrollments) {
      const completedAt = enrollment.completedAt;
      if (!completedAt) continue;

      const programId = enrollment.trainingProgramId.toString();
      let programInfo = programCache.get(programId);

      if (!programInfo) {
        const trainingProgram = await this.trainingProgramsRepository.findById(
          enrollment.trainingProgramId,
          tenantId,
        );
        if (!trainingProgram) continue;

        programInfo = {
          name: trainingProgram.name,
          validityMonths: trainingProgram.validityMonths ?? null,
        };
        programCache.set(programId, programInfo);
      }

      if (!programInfo.validityMonths) continue;

      const expirationDate = new Date(completedAt);
      expirationDate.setMonth(
        expirationDate.getMonth() + programInfo.validityMonths,
      );

      if (expirationDate < referenceDate || expirationDate > upperBound) {
        continue;
      }

      expiringTrainings.push({
        kind: 'training',
        entityId: enrollment.id.toString(),
        employeeId: enrollment.employeeId.toString(),
        expirationDate,
        description: programInfo.name,
      });
    }

    return expiringTrainings;
  }

  /**
   * Resolves the user that should receive the notification for an employee,
   * preferring the supervisor's linked user, otherwise the employee's own user.
   */
  private async resolveResponsibleUserId(
    employeeId: string,
    tenantId: string,
  ): Promise<string | null> {
    const employee = await this.findEmployee(employeeId, tenantId);
    if (!employee) return null;

    if (employee.supervisorId) {
      const supervisor = await this.employeesRepository.findById(
        employee.supervisorId,
        tenantId,
      );
      if (supervisor?.userId) {
        return supervisor.userId.toString();
      }
    }

    return employee.userId?.toString() ?? null;
  }

  private async findEmployee(
    employeeId: string,
    tenantId: string,
  ): Promise<Employee | null> {
    return this.employeesRepository.findById(
      new UniqueEntityID(employeeId),
      tenantId,
    );
  }
}

function buildNotificationPayload(item: ExpiringItem): {
  title: string;
  message: string;
  entityType: string;
  actionUrl: string;
} {
  const formattedDate = item.expirationDate.toLocaleDateString('pt-BR');

  if (item.kind === 'medicalExam') {
    return {
      title: 'Exame médico próximo do vencimento',
      message: `O exame "${item.description}" vence em ${formattedDate}.`,
      entityType: 'MEDICAL_EXAM',
      actionUrl: `/hr/medical-exams/${item.entityId}`,
    };
  }

  return {
    title: 'Treinamento próximo do vencimento',
    message: `A certificação do treinamento "${item.description}" vence em ${formattedDate}.`,
    entityType: 'TRAINING_ENROLLMENT',
    actionUrl: `/hr/trainings/${item.entityId}`,
  };
}
