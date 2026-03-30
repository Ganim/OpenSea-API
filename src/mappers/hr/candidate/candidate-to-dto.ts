import type { Candidate } from '@/entities/hr/candidate';

export interface CandidateDTO {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  cpf: string | null;
  resumeUrl: string | null;
  linkedinUrl: string | null;
  source: string;
  notes: string | null;
  tags: string[] | null;
  createdAt: string;
  updatedAt: string;
}

export function candidateToDTO(candidate: Candidate): CandidateDTO {
  return {
    id: candidate.id.toString(),
    fullName: candidate.fullName,
    email: candidate.email,
    phone: candidate.phone ?? null,
    cpf: candidate.cpf ?? null,
    resumeUrl: candidate.resumeUrl ?? null,
    linkedinUrl: candidate.linkedinUrl ?? null,
    source: candidate.source,
    notes: candidate.notes ?? null,
    tags: candidate.tags ?? null,
    createdAt: candidate.createdAt.toISOString(),
    updatedAt: candidate.updatedAt.toISOString(),
  };
}
