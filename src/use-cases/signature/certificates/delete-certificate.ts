import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { DigitalCertificatesRepository } from '@/repositories/signature/digital-certificates-repository';

interface DeleteCertificateUseCaseRequest {
  tenantId: string;
  certificateId: string;
}

export class DeleteCertificateUseCase {
  constructor(
    private digitalCertificatesRepository: DigitalCertificatesRepository,
  ) {}

  async execute(request: DeleteCertificateUseCaseRequest): Promise<void> {
    const certificate = await this.digitalCertificatesRepository.findById(
      new UniqueEntityID(request.certificateId),
      request.tenantId,
    );

    if (!certificate) {
      throw new ResourceNotFoundError('Certificate not found');
    }

    await this.digitalCertificatesRepository.delete(
      new UniqueEntityID(request.certificateId),
    );
  }
}
