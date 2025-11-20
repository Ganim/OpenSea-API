import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { TemplateDTO } from '@/mappers/stock/template/template-to-dto';
import { templateToDTO } from '@/mappers/stock/template/template-to-dto';
import { TemplatesRepository } from '@/repositories/stock/templates-repository';

interface GetTemplateByIdUseCaseRequest {
  id: string;
}

interface GetTemplateByIdUseCaseResponse {
  template: TemplateDTO;
}

export class GetTemplateByIdUseCase {
  constructor(private templatesRepository: TemplatesRepository) {}

  async execute(
    request: GetTemplateByIdUseCaseRequest,
  ): Promise<GetTemplateByIdUseCaseResponse> {
    const { id } = request;

    const template = await this.templatesRepository.findById(
      new UniqueEntityID(id),
    );

    if (!template) {
      throw new ResourceNotFoundError('Template not found');
    }

    return {
      template: templateToDTO(template),
    };
  }
}
