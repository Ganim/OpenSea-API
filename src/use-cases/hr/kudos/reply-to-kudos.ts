import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { KudosNotFoundError } from '@/@errors/use-cases/kudos-not-found-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { KudosReply } from '@/entities/hr/kudos-reply';
import type { EmployeeKudosRepository } from '@/repositories/hr/employee-kudos-repository';
import type { KudosRepliesRepository } from '@/repositories/hr/kudos-replies-repository';

export interface ReplyToKudosInput {
  tenantId: string;
  kudosId: string;
  employeeId: string;
  content: string;
}

export interface ReplyToKudosOutput {
  reply: KudosReply;
}

export class ReplyToKudosUseCase {
  constructor(
    private readonly employeeKudosRepository: EmployeeKudosRepository,
    private readonly kudosRepliesRepository: KudosRepliesRepository,
  ) {}

  async execute(input: ReplyToKudosInput): Promise<ReplyToKudosOutput> {
    const trimmedContent = input.content.trim();

    if (!trimmedContent) {
      throw new BadRequestError('Reply content is required');
    }

    const kudosId = new UniqueEntityID(input.kudosId);

    const kudos = await this.employeeKudosRepository.findById(
      kudosId,
      input.tenantId,
    );

    if (!kudos) {
      throw new KudosNotFoundError();
    }

    const reply = KudosReply.create({
      tenantId: new UniqueEntityID(input.tenantId),
      kudosId,
      employeeId: new UniqueEntityID(input.employeeId),
      content: trimmedContent,
    });

    await this.kudosRepliesRepository.create(reply);

    return { reply };
  }
}
