import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Candidate } from '@/entities/hr/candidate';
import type { CandidatesRepository } from '@/repositories/hr/candidates-repository';
import type { AnonymizeCandidateUseCase } from './anonymize-candidate';

export interface DeleteCandidateRequest {
  tenantId: string;
  candidateId: string;
  /**
   * Subject identifier of the user triggering the deletion. Recorded in the
   * candidate's anonymizedBy column so the LGPD audit trail captures who
   * invoked the right to erasure (SAR).
   */
  actorUserId?: string;
}

export interface DeleteCandidateResponse {
  candidate: Candidate;
}

/**
 * Soft-deletes a candidate AND scrubs every PII field (LGPD Art. 18 VI —
 * right to erasure). Hard-delete is deliberately avoided: the row must
 * remain referenceable by its historical applications so recruitment
 * funnel metrics keep working. The anonymization call is idempotent — if
 * the candidate was already scrubbed (e.g. after a final rejection) the
 * call returns silently without touching the data again.
 */
export class DeleteCandidateUseCase {
  constructor(
    private candidatesRepository: CandidatesRepository,
    /**
     * Optional to keep legacy tests that instantiated the use case without
     * the anonymization chain passing. Production callers always wire it
     * via the factory.
     */
    private anonymizeCandidateUseCase?: AnonymizeCandidateUseCase,
  ) {}

  async execute(
    request: DeleteCandidateRequest,
  ): Promise<DeleteCandidateResponse> {
    const { tenantId, candidateId, actorUserId } = request;

    const candidate = await this.candidatesRepository.findById(
      new UniqueEntityID(candidateId),
      tenantId,
    );

    if (!candidate) {
      throw new ResourceNotFoundError('Candidato não encontrado');
    }

    // Scrub PII first so the row is LGPD-compliant even if a concurrent
    // reader sees the soft-deleted state before our delete call commits.
    if (this.anonymizeCandidateUseCase) {
      await this.anonymizeCandidateUseCase.execute({
        tenantId,
        candidateId,
        actorUserId: actorUserId ?? 'system',
      });
    }

    candidate.softDelete();

    await this.candidatesRepository.delete(
      new UniqueEntityID(candidateId),
      tenantId,
    );

    // Re-read so the caller observes both the anonymization and the
    // soft-delete timestamp.
    const refreshed =
      (await this.candidatesRepository.findById(
        new UniqueEntityID(candidateId),
        tenantId,
      )) ?? candidate;

    return { candidate: refreshed };
  }
}
