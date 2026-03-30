import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ConflictError } from '@/@errors/use-cases/conflict-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Application } from '@/entities/hr/application';
import type { ApplicationsRepository } from '@/repositories/hr/applications-repository';
import type { CandidatesRepository } from '@/repositories/hr/candidates-repository';
import type { JobPostingsRepository } from '@/repositories/hr/job-postings-repository';

export interface CreateApplicationRequest {
  tenantId: string;
  jobPostingId: string;
  candidateId: string;
}

export interface CreateApplicationResponse {
  application: Application;
}

export class CreateApplicationUseCase {
  constructor(
    private applicationsRepository: ApplicationsRepository,
    private jobPostingsRepository: JobPostingsRepository,
    private candidatesRepository: CandidatesRepository,
  ) {}

  async execute(
    request: CreateApplicationRequest,
  ): Promise<CreateApplicationResponse> {
    const { tenantId, jobPostingId, candidateId } = request;

    const jobPosting = await this.jobPostingsRepository.findById(
      new UniqueEntityID(jobPostingId),
      tenantId,
    );

    if (!jobPosting) {
      throw new ResourceNotFoundError('Vaga não encontrada');
    }

    if (jobPosting.status !== 'OPEN') {
      throw new BadRequestError(
        'Não é possível candidatar-se a uma vaga que não está aberta',
      );
    }

    const candidate = await this.candidatesRepository.findById(
      new UniqueEntityID(candidateId),
      tenantId,
    );

    if (!candidate) {
      throw new ResourceNotFoundError('Candidato não encontrado');
    }

    const existingApplication =
      await this.applicationsRepository.findByJobAndCandidate(
        jobPostingId,
        candidateId,
        tenantId,
      );

    if (existingApplication) {
      throw new ConflictError(
        'Este candidato já possui uma candidatura para esta vaga',
      );
    }

    if (jobPosting.maxApplicants) {
      const currentCount =
        await this.applicationsRepository.countByJobPosting(
          jobPostingId,
          tenantId,
        );

      if (currentCount >= jobPosting.maxApplicants) {
        throw new BadRequestError(
          'O número máximo de candidatos para esta vaga foi atingido',
        );
      }
    }

    const application = await this.applicationsRepository.create({
      tenantId,
      jobPostingId,
      candidateId,
    });

    return { application };
  }
}
