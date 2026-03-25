import { Entity } from '../domain/entities';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface GeofenceZoneProps {
  tenantId: string;
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  isActive: boolean;
  address: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class GeofenceZone extends Entity<GeofenceZoneProps> {
  get tenantId(): string {
    return this.props.tenantId;
  }

  get name(): string {
    return this.props.name;
  }

  get latitude(): number {
    return this.props.latitude;
  }

  get longitude(): number {
    return this.props.longitude;
  }

  get radiusMeters(): number {
    return this.props.radiusMeters;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get address(): string | null {
    return this.props.address;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  private constructor(props: GeofenceZoneProps, id?: UniqueEntityID) {
    super(props, id);
  }

  static create(
    props: Omit<GeofenceZoneProps, 'createdAt' | 'updatedAt'> &
      Partial<Pick<GeofenceZoneProps, 'createdAt' | 'updatedAt'>>,
    id?: UniqueEntityID,
  ): GeofenceZone {
    return new GeofenceZone(
      {
        ...props,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );
  }
}
