import type { KudosReaction } from '@/entities/hr/kudos-reaction';

export interface KudosReactionDTO {
  id: string;
  kudosId: string;
  employeeId: string;
  emoji: string;
  createdAt: Date;
}

export function kudosReactionToDTO(reaction: KudosReaction): KudosReactionDTO {
  return {
    id: reaction.id.toString(),
    kudosId: reaction.kudosId.toString(),
    employeeId: reaction.employeeId.toString(),
    emoji: reaction.emoji,
    createdAt: reaction.createdAt,
  };
}
