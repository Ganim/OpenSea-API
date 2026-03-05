import { PrismaBoardCustomFieldsRepository } from '@/repositories/tasks/prisma/prisma-board-custom-fields-repository';
import { ListCustomFieldsUseCase } from '../list-custom-fields';

export function makeListCustomFieldsUseCase() {
  const boardCustomFieldsRepository = new PrismaBoardCustomFieldsRepository();
  return new ListCustomFieldsUseCase(boardCustomFieldsRepository);
}
