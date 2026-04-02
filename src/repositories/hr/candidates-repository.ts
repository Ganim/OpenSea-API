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

export interface CandidatesRepository {
  create(data: CreateCandidateSchema): Promise<Candidate>;
  findById(id: UniqueEntityID, tenantId: string): Promise<Candidate | null>;
  findByEmail(email: string, tenantId: string): Promise<Candidate | null>;
  findMany(
    tenantId: string,
    filters?: FindCandidateFilters,
  ): Promise<{ candidates: Candidate[]; total: number }>;
  update(data: UpdateCandidateSchema): Promise<Candidate | null>;
  delete(id: UniqueEntityID): Promise<void>;
}
