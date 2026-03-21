import { PrismaCardActivitiesRepository } from '@/repositories/tasks/prisma/prisma-card-activities-repository';
import { PrismaCardsRepository } from '@/repositories/tasks/prisma/prisma-cards-repository';
import { PrismaBoardCustomFieldsRepository } from '@/repositories/tasks/prisma/prisma-board-custom-fields-repository';
import { PrismaCardCustomFieldValuesRepository } from '@/repositories/tasks/prisma/prisma-card-custom-field-values-repository';
import { SetCardCustomFieldValuesUseCase } from '../set-card-custom-field-values';

export function makeSetCardCustomFieldValuesUseCase() {
  const cardsRepository = new PrismaCardsRepository();
  const boardCustomFieldsRepository = new PrismaBoardCustomFieldsRepository();
  const cardCustomFieldValuesRepository =
    new PrismaCardCustomFieldValuesRepository();
  const cardActivitiesRepository = new PrismaCardActivitiesRepository();
  return new SetCardCustomFieldValuesUseCase(
    cardsRepository,
    boardCustomFieldsRepository,
    cardCustomFieldValuesRepository,
    cardActivitiesRepository,
  );
}
