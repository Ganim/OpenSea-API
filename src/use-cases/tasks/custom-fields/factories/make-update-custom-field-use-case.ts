import { PrismaBoardCustomFieldsRepository } from '@/repositories/tasks/prisma/prisma-board-custom-fields-repository';
import { UpdateCustomFieldUseCase } from '../update-custom-field';

export function makeUpdateCustomFieldUseCase() {
  const boardCustomFieldsRepository = new PrismaBoardCustomFieldsRepository();
  return new UpdateCustomFieldUseCase(boardCustomFieldsRepository);
}
