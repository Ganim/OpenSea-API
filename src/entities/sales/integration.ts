import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface IntegrationProps {
  id: UniqueEntityID;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  category: string;
  configSchema: Record<string, unknown>;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export class Integration extends Entity<IntegrationProps> {
  get id(): UniqueEntityID {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get slug(): string {
    return this.props.slug;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get logoUrl(): string | undefined {
    return this.props.logoUrl;
  }

  get category(): string {
    return this.props.category;
  }

  get configSchema(): Record<string, unknown> {
    return this.props.configSchema;
  }

  get isAvailable(): boolean {
    return this.props.isAvailable;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date | undefined {
    return this.props.updatedAt;
  }

  static create(
    props: Optional<IntegrationProps, 'id' | 'isAvailable' | 'createdAt'>,
    id?: UniqueEntityID,
  ): Integration {
    const integration = new Integration(
      {
        ...props,
        id: id ?? new UniqueEntityID(),
        isAvailable: props.isAvailable ?? true,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );

    return integration;
  }
}
