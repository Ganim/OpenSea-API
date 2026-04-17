import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { TrainingEnrollment } from '@/entities/hr/training-enrollment';
import type { EsocialEventsRepository } from '@/repositories/esocial/esocial-events-repository';
import type { TrainingEnrollmentsRepository } from '@/repositories/hr/training-enrollments-repository';
import type { TrainingProgramsRepository } from '@/repositories/hr/training-programs-repository';

/**
 * Fallback validity (months) when the TrainingProgram does not declare one.
 * Matches the "24 months" figure used by most NR-10/NR-35 training providers
 * and MTE guidance — conservative enough that the reminder cron still fires
 * well before real expiry.
 */
const DEFAULT_CERTIFICATE_VALIDITY_MONTHS = 24;

export interface CompleteEnrollmentRequest {
  tenantId: string;
  enrollmentId: string;
  score?: number;
  certificateUrl?: string;
}

export interface CompleteEnrollmentResponse {
  enrollment: TrainingEnrollment;
  /**
   * `true` when the completed program carried `isMandatoryForESocial=true`
   * and an S-2240 DRAFT event was enqueued for manager review. The controller
   * can surface this in the response so the UI shows "evento S-2240 gerado
   * como rascunho".
   */
  esocialEventQueued: boolean;
}

export class CompleteEnrollmentUseCase {
  constructor(
    private trainingEnrollmentsRepository: TrainingEnrollmentsRepository,
    /**
     * Optional so existing unit tests that only exercise happy-path training
     * completion don't need to wire the program/esocial repos. Production
     * callers must pass all three.
     */
    private trainingProgramsRepository?: TrainingProgramsRepository,
    private esocialEventsRepository?: EsocialEventsRepository,
  ) {}

  async execute(
    request: CompleteEnrollmentRequest,
  ): Promise<CompleteEnrollmentResponse> {
    const { tenantId, enrollmentId, score, certificateUrl } = request;

    const enrollment = await this.trainingEnrollmentsRepository.findById(
      new UniqueEntityID(enrollmentId),
      tenantId,
    );

    if (!enrollment) {
      throw new ResourceNotFoundError('Inscrição não encontrada');
    }

    if (enrollment.status === 'COMPLETED') {
      throw new BadRequestError('Esta inscrição já foi concluída');
    }

    if (enrollment.status === 'CANCELLED') {
      throw new BadRequestError(
        'Não é possível concluir uma inscrição cancelada',
      );
    }

    if (score !== undefined && (score < 0 || score > 100)) {
      throw new BadRequestError('A nota deve estar entre 0 e 100');
    }

    const completedAt = new Date();

    // Resolve the related program so we can (a) compute an expirationDate
    // from validityMonths for the retraining cron and (b) decide whether to
    // auto-enqueue an S-2240 draft event. We tolerate the program being
    // missing — that would only happen mid-migration or for legacy data and
    // the completion itself must still succeed.
    const program = this.trainingProgramsRepository
      ? await this.trainingProgramsRepository.findById(
          enrollment.trainingProgramId,
          tenantId,
        )
      : null;

    const validityMonths =
      program?.validityMonths ?? DEFAULT_CERTIFICATE_VALIDITY_MONTHS;
    const expirationDate = new Date(completedAt);
    expirationDate.setMonth(expirationDate.getMonth() + validityMonths);

    const updatedEnrollment = await this.trainingEnrollmentsRepository.update({
      id: new UniqueEntityID(enrollmentId),
      tenantId,
      status: 'COMPLETED',
      completedAt,
      expirationDate,
      score,
      certificateUrl,
    });

    if (!updatedEnrollment) {
      throw new ResourceNotFoundError('Inscrição não encontrada');
    }

    // Auto-enqueue S-2240 (Condições Ambientais do Trabalho) as a DRAFT when
    // the program was flagged as mandatory for eSocial. We deliberately do
    // NOT attempt full transmission — the S-2240 builder requires infoAmb +
    // fatRisco data that only HR can confirm. Dropping a DRAFT on the queue
    // is enough to unblock the 30-day compliance deadline and kick off the
    // manual review.
    let esocialEventQueued = false;
    if (
      program?.isMandatoryForESocial &&
      this.esocialEventsRepository
    ) {
      // Placeholder XML — the final XML is assembled when HR fills in infoAmb
      // + fatRisco via the S-2240 review UI. We store a minimal marker so
      // the DRAFT row is valid and discoverable by referenceId.
      const placeholderXml = `<!-- DRAFT auto-enqueued from training completion; employeeId=${enrollment.employeeId.toString()}, programId=${enrollment.trainingProgramId.toString()} -->`;

      await this.esocialEventsRepository.create({
        tenantId,
        eventType: 'S_2240',
        status: 'DRAFT',
        referenceType: 'TRAINING_ENROLLMENT',
        referenceId: enrollmentId,
        xmlContent: placeholderXml,
      });
      esocialEventQueued = true;
    }

    return { enrollment: updatedEnrollment, esocialEventQueued };
  }
}
