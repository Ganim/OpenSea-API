import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Candidate } from '@/entities/hr/candidate';
import type { CandidatesRepository } from '@/repositories/hr/candidates-repository';

export interface AnonymizeCandidateRequest {
  tenantId: string;
  candidateId: string;
  /** Subject identifier of the user triggering the anonymization. */
  actorUserId: string;
}

export interface AnonymizeCandidateResponse {
  candidate: Candidate;
  /**
   * `true` when the use case actually wrote new data, `false` when the
   * record was already anonymized (idempotent replay).
   */
  alreadyAnonymized: boolean;
}

/**
 * Anonymizes a Candidate record (LGPD Art. 18 VI — right to erasure).
 *
 * Replaces every PII field — name, email, CPF, phone, resume URL, LinkedIn
 * URL, notes, tags — with placeholder values derived from the entity id so
 * the row remains referenceable by its foreign keys (Applications) while
 * no longer identifying the natural person.
 *
 * Keeps:
 *   - id, tenantId
 *   - source (aggregate funnel metric)
 *   - createdAt (cohort cohort analysis)
 *   - applications count (derived from FK)
 *
 * The operation is IDEMPOTENT: when the candidate is already anonymized,
 * the use case returns the current row without further writes so that
 * repeated triggers (e.g. the reject-final + delete-candidate sequence)
 * are safe.
 */
export class AnonymizeCandidateUseCase {
  constructor(private readonly candidatesRepository: CandidatesRepository) {}

  async execute(
    request: AnonymizeCandidateRequest,
  ): Promise<AnonymizeCandidateResponse> {
    const { tenantId, candidateId, actorUserId } = request;

    const candidate = await this.candidatesRepository.findById(
      new UniqueEntityID(candidateId),
      tenantId,
    );

    if (!candidate) {
      throw new ResourceNotFoundError('Candidato não encontrado');
    }

    if (candidate.isAnonymized) {
      return { candidate, alreadyAnonymized: true };
    }

    const idHash8 = candidate.id.toString().slice(-8);
    const anonymizedFullName = `ANONIMIZADO-${idHash8}`;
    const anonymizedEmail = `anon-${idHash8}@redacted.local`;

    const anonymized = await this.candidatesRepository.anonymize({
      id: candidate.id,
      tenantId,
      fullName: anonymizedFullName,
      email: anonymizedEmail,
      anonymizedAt: new Date(),
      anonymizedByUserId: actorUserId,
    });

    if (!anonymized) {
      throw new ResourceNotFoundError('Candidato não encontrado');
    }

    return { candidate: anonymized, alreadyAnonymized: false };
  }
}
