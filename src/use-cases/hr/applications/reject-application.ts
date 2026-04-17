import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Application } from '@/entities/hr/application';
import type { ApplicationsRepository } from '@/repositories/hr/applications-repository';
import type { AnonymizeCandidateUseCase } from '../candidates/anonymize-candidate';

export interface RejectApplicationRequest {
  tenantId: string;
  applicationId: string;
  rejectionReason?: string;
  /**
   * When `true` the rejection is considered final (no re-apply expected) and
   * the candidate's PII is scrubbed via the LGPD anonymization flow. The
   * default (`undefined`/`false`) keeps the candidate data intact so the
   * recruiter can reach out through another vacancy — this matches the
   * "reject from this role, keep in the pool" UX.
   */
  final?: boolean;
  /**
   * Subject identifier of the user triggering the rejection. Required when
   * `final=true` so the audit trail captures who ordered the LGPD scrub.
   */
  actorUserId?: string;
}

export interface RejectApplicationResponse {
  application: Application;
  /** `true` when the candidate PII was scrubbed as part of this rejection. */
  candidateAnonymized: boolean;
}

export class RejectApplicationUseCase {
  constructor(
    private applicationsRepository: ApplicationsRepository,
    /**
     * Optional so legacy unit tests that instantiate the use case without
     * the anonymization chain keep working. Production callers always wire
     * it via the factory.
     */
    private anonymizeCandidateUseCase?: AnonymizeCandidateUseCase,
  ) {}

  async execute(
    request: RejectApplicationRequest,
  ): Promise<RejectApplicationResponse> {
    const {
      tenantId,
      applicationId,
      rejectionReason,
      final = false,
      actorUserId,
    } = request;

    const existingApplication = await this.applicationsRepository.findById(
      new UniqueEntityID(applicationId),
      tenantId,
    );

    if (!existingApplication) {
      throw new ResourceNotFoundError('Candidatura não encontrada');
    }

    if (
      existingApplication.status === 'HIRED' ||
      existingApplication.status === 'REJECTED'
    ) {
      throw new BadRequestError('Esta candidatura já foi finalizada');
    }

    const updatedApplication = await this.applicationsRepository.update({
      id: new UniqueEntityID(applicationId),
      tenantId,
      status: 'REJECTED',
      rejectedAt: new Date(),
      rejectionReason,
    });

    if (!updatedApplication) {
      throw new ResourceNotFoundError('Candidatura não encontrada');
    }

    let candidateAnonymized = false;

    if (final && this.anonymizeCandidateUseCase) {
      await this.anonymizeCandidateUseCase.execute({
        tenantId,
        candidateId: existingApplication.candidateId.toString(),
        actorUserId: actorUserId ?? 'system',
      });
      candidateAnonymized = true;
    }

    return { application: updatedApplication, candidateAnonymized };
  }
}
