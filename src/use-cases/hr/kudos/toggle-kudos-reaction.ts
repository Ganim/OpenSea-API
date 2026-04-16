import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { KudosNotFoundError } from '@/@errors/use-cases/kudos-not-found-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { KudosReaction } from '@/entities/hr/kudos-reaction';
import type { EmployeeKudosRepository } from '@/repositories/hr/employee-kudos-repository';
import type { KudosReactionsRepository } from '@/repositories/hr/kudos-reactions-repository';

const MAX_EMOJI_LENGTH = 16;

export interface ToggleKudosReactionInput {
  tenantId: string;
  kudosId: string;
  employeeId: string;
  emoji: string;
}

export interface ToggleKudosReactionOutput {
  action: 'added' | 'removed';
  reaction: KudosReaction | null;
}

/**
 * Adds a reaction to a kudos when none exists for the
 * (kudosId, employeeId, emoji) tuple, otherwise removes the existing one.
 * The unique constraint at the database level guarantees idempotency.
 */
export class ToggleKudosReactionUseCase {
  constructor(
    private readonly employeeKudosRepository: EmployeeKudosRepository,
    private readonly kudosReactionsRepository: KudosReactionsRepository,
  ) {}

  async execute(
    input: ToggleKudosReactionInput,
  ): Promise<ToggleKudosReactionOutput> {
    const trimmedEmoji = input.emoji.trim();

    if (!trimmedEmoji) {
      throw new BadRequestError('Emoji is required');
    }

    if (trimmedEmoji.length > MAX_EMOJI_LENGTH) {
      throw new BadRequestError(
        `Emoji exceeds the ${MAX_EMOJI_LENGTH} character limit`,
      );
    }

    const kudosId = new UniqueEntityID(input.kudosId);
    const employeeId = new UniqueEntityID(input.employeeId);

    const kudos = await this.employeeKudosRepository.findById(
      kudosId,
      input.tenantId,
    );

    if (!kudos) {
      throw new KudosNotFoundError();
    }

    const existingReaction =
      await this.kudosReactionsRepository.findByKudosEmployeeEmoji(
        kudosId,
        employeeId,
        trimmedEmoji,
      );

    if (existingReaction) {
      await this.kudosReactionsRepository.delete(existingReaction.id);
      return { action: 'removed', reaction: null };
    }

    const newReaction = KudosReaction.create({
      tenantId: new UniqueEntityID(input.tenantId),
      kudosId,
      employeeId,
      emoji: trimmedEmoji,
    });

    await this.kudosReactionsRepository.create(newReaction);

    return { action: 'added', reaction: newReaction };
  }
}
