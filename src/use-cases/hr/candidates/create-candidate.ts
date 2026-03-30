import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ConflictError } from '@/@errors/use-cases/conflict-error';
import type { Candidate } from '@/entities/hr/candidate';
import type { CandidatesRepository } from '@/repositories/hr/candidates-repository';

const VALID_SOURCES = [
  'WEBSITE',
  'LINKEDIN',
  'REFERRAL',
  'AGENCY',
  'OTHER',
] as const;

export interface CreateCandidateRequest {
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

export interface CreateCandidateResponse {
  candidate: Candidate;
}

export class CreateCandidateUseCase {
  constructor(private candidatesRepository: CandidatesRepository) {}

  async execute(
    request: CreateCandidateRequest,
  ): Promise<CreateCandidateResponse> {
    const { tenantId, fullName, email, source, ...restData } = request;

    if (!fullName || fullName.trim().length === 0) {
      throw new BadRequestError('O nome do candidato é obrigatório');
    }

    if (!email || email.trim().length === 0) {
      throw new BadRequestError('O e-mail do candidato é obrigatório');
    }

    if (
      source &&
      !VALID_SOURCES.includes(source as (typeof VALID_SOURCES)[number])
    ) {
      throw new BadRequestError(
        `Origem inválida. Origens válidas: ${VALID_SOURCES.join(', ')}`,
      );
    }

    const existingCandidate = await this.candidatesRepository.findByEmail(
      email.trim().toLowerCase(),
      tenantId,
    );

    if (existingCandidate) {
      throw new ConflictError(
        'Já existe um candidato cadastrado com este e-mail',
      );
    }

    const candidate = await this.candidatesRepository.create({
      tenantId,
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      source,
      ...restData,
    });

    return { candidate };
  }
}
