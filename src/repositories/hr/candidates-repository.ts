import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Candidate } from '@/entities/hr/candidate';

export interface CreateCandidateSchema {
  tenantId: string;
  fullName: string;
  email: string;
  phone?: string;
  cpf?: string;
  resumeUrl?: string;
  linkedinUrl?: string;
  source?: string;
  notes?: string;
  tags?: string[];
}

export interface UpdateCandidateSchema {
  id: UniqueEntityID;
  /**
   * Tenant identifier for multi-tenant write isolation. Optional for backward
   * compatibility during the defense-in-depth rollout, but callers MUST pass
   * it so the underlying Prisma `where` clause is scoped and cannot update a
   * record belonging to another tenant.
   */
  tenantId?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  cpf?: string;
  resumeUrl?: string;
  linkedinUrl?: string;
  source?: string;
  notes?: string;
  tags?: string[];
}

export interface FindCandidateFilters {
  source?: string;
  search?: string;
  tags?: string[];
  page?: number;
  perPage?: number;
}

/**
 * Input payload accepted by {@link CandidatesRepository.anonymize} to scrub
 * every PII column under LGPD Art. 18 VI. The caller is expected to have
 * already produced the anonymized values via the Candidate entity's
 * `anonymize()` method — the repository simply persists them.
 */
export interface AnonymizeCandidateSchema {
  id: UniqueEntityID;
  /** Tenant identifier for multi-tenant write isolation. */
  tenantId: string;
  fullName: string;
  email: string;
  anonymizedAt: Date;
  anonymizedByUserId: string;
}

export interface CandidatesRepository {
  create(data: CreateCandidateSchema): Promise<Candidate>;
  findById(id: UniqueEntityID, tenantId: string): Promise<Candidate | null>;
  findByEmail(email: string, tenantId: string): Promise<Candidate | null>;
  findMany(
    tenantId: string,
    filters?: FindCandidateFilters,
  ): Promise<{ candidates: Candidate[]; total: number }>;
  update(data: UpdateCandidateSchema): Promise<Candidate | null>;
  delete(id: UniqueEntityID, tenantId?: string): Promise<void>;
  /**
   * Persists an LGPD anonymization event on the candidate row. The
   * repository MUST overwrite fullName, email, and null-out cpf, phone,
   * resumeUrl, linkedinUrl, notes, tags; stamp anonymizedAt/anonymizedBy;
   * and keep the row otherwise intact (no hard delete, no cascade on
   * applications). The call is idempotent: anonymizing an already-scrubbed
   * record returns the existing row without further writes.
   */
  anonymize(data: AnonymizeCandidateSchema): Promise<Candidate | null>;
}
