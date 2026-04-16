import { Entity } from '../domain/entities';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface KudosReactionProps {
  tenantId: UniqueEntityID;
  kudosId: UniqueEntityID;
  employeeId: UniqueEntityID;
  emoji: string;
  createdAt: Date;
}

export class KudosReaction extends Entity<KudosReactionProps> {
  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get kudosId(): UniqueEntityID {
    return this.props.kudosId;
  }

  get employeeId(): UniqueEntityID {
    return this.props.employeeId;
  }

  get emoji(): string {
    return this.props.emoji;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  private constructor(props: KudosReactionProps, id?: UniqueEntityID) {
    super(props, id);
  }

  static create(
    props: Omit<KudosReactionProps, 'createdAt'> & { createdAt?: Date },
    id?: UniqueEntityID,
  ): KudosReaction {
    return new KudosReaction(
      {
        ...props,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );
  }
}
