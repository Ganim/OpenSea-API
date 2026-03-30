import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Candidate } from '@/entities/hr/candidate';
import type { CandidatesRepository } from '@/repositories/hr/candidates-repository';

export interface UpdateCandidateRequest {
  tenantId: string;
  candidateId: string;
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

export interface UpdateCandidateResponse {
  candidate: Candidate;
}

export class UpdateCandidateUseCase {
  constructor(private candidatesRepository: CandidatesRepository) {}

  async execute(
    request: UpdateCandidateRequest,
  ): Promise<UpdateCandidateResponse> {
    const { tenantId, candidateId, fullName, ...updateData } = request;

    const existingCandidate = await this.candidatesRepository.findById(
      new UniqueEntityID(candidateId),
      tenantId,
    );

    if (!existingCandidate) {
      throw new ResourceNotFoundError('Candidato não encontrado');
    }

    if (fullName !== undefined && fullName.trim().length === 0) {
      throw new BadRequestError('O nome do candidato é obrigatório');
    }

    const updatedCandidate = await this.candidatesRepository.update({
      id: new UniqueEntityID(candidateId),
      fullName: fullName?.trim(),
      ...updateData,
    });

    if (!updatedCandidate) {
      throw new ResourceNotFoundError('Candidato não encontrado');
    }

    return { candidate: updatedCandidate };
  }
}
