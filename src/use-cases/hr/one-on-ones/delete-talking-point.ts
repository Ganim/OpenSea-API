import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { OneOnOneTalkingPointsRepository } from '@/repositories/hr/one-on-one-talking-points-repository';

export interface DeleteTalkingPointRequest {
  talkingPointId: string;
  viewerEmployeeId: string;
}

export class DeleteTalkingPointUseCase {
  constructor(
    private talkingPointsRepository: OneOnOneTalkingPointsRepository,
  ) {}

  async execute(request: DeleteTalkingPointRequest): Promise<void> {
    const { talkingPointId, viewerEmployeeId } = request;

    const talkingPoint = await this.talkingPointsRepository.findById(
      new UniqueEntityID(talkingPointId),
    );

    if (!talkingPoint) {
      throw new ResourceNotFoundError('TalkingPoint');
    }

    if (!talkingPoint.isAuthor(new UniqueEntityID(viewerEmployeeId))) {
      throw new ForbiddenError(
        'Apenas o autor pode remover o tópico de discussão',
      );
    }

    await this.talkingPointsRepository.delete(talkingPoint.id);
  }
}
