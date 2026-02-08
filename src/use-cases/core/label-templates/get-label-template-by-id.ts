import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { LabelTemplateDTO } from '@/mappers/core/label-template/label-template-to-dto';
import { labelTemplateToDTO } from '@/mappers/core/label-template/label-template-to-dto';
import type { LabelTemplatesRepository } from '@/repositories/core/label-templates-repository';

interface GetLabelTemplateByIdUseCaseRequest {
  id: string;
  tenantId: string;
}

interface GetLabelTemplateByIdUseCaseResponse {
  template: LabelTemplateDTO;
}

export class GetLabelTemplateByIdUseCase {
  constructor(private labelTemplatesRepository: LabelTemplatesRepository) {}

  async execute(
    request: GetLabelTemplateByIdUseCaseRequest,
  ): Promise<GetLabelTemplateByIdUseCaseResponse> {
    const { id, tenantId } = request;

    const labelTemplate = await this.labelTemplatesRepository.findById(
      new UniqueEntityID(tenantId),
      new UniqueEntityID(id),
    );

    if (!labelTemplate) {
      throw new ResourceNotFoundError('Label template not found');
    }

    return {
      template: labelTemplateToDTO(labelTemplate),
    };
  }
}
