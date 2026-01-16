import { Entity } from '../domain/entities';
import type { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface VolumeItemProps {
  volumeId: string;
  itemId: string;
  addedAt: Date;
  addedBy: string;
}

export class VolumeItem extends Entity<VolumeItemProps> {
  get volumeId(): string {
    return this.props.volumeId;
  }

  get itemId(): string {
    return this.props.itemId;
  }

  get addedAt(): Date {
    return this.props.addedAt;
  }

  get addedBy(): string {
    return this.props.addedBy;
  }

  static create(
    props: Optional<VolumeItemProps, 'addedAt'>,
    id?: UniqueEntityID,
  ): VolumeItem {
    const volumeItem = new VolumeItem(
      {
        ...props,
        addedAt: props.addedAt ?? new Date(),
      },
      id,
    );

    return volumeItem;
  }
}
