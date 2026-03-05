import { PrismaBoardsRepository } from '@/repositories/tasks/prisma/prisma-boards-repository';
import { PrismaBoardCustomFieldsRepository } from '@/repositories/tasks/prisma/prisma-board-custom-fields-repository';
import { CreateCustomFieldUseCase } from '../create-custom-field';

export function makeCreateCustomFieldUseCase() {
  const boardsRepository = new PrismaBoardsRepository();
  const boardCustomFieldsRepository = new PrismaBoardCustomFieldsRepository();
  return new CreateCustomFieldUseCase(boardsRepository, boardCustomFieldsRepository);
}
