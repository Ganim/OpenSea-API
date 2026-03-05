import { PrismaBoardCustomFieldsRepository } from '@/repositories/tasks/prisma/prisma-board-custom-fields-repository';
import { PrismaCardCustomFieldValuesRepository } from '@/repositories/tasks/prisma/prisma-card-custom-field-values-repository';
import { DeleteCustomFieldUseCase } from '../delete-custom-field';

export function makeDeleteCustomFieldUseCase() {
  const boardCustomFieldsRepository = new PrismaBoardCustomFieldsRepository();
  const cardCustomFieldValuesRepository = new PrismaCardCustomFieldValuesRepository();
  return new DeleteCustomFieldUseCase(boardCustomFieldsRepository, cardCustomFieldValuesRepository);
}
