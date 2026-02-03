import { Entity } from '../domain/entities';
import type { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';
import { VolumeStatus } from './value-objects/volume-status';

export interface VolumeProps {
  tenantId: UniqueEntityID;
  code: string;
  name?: string;
  status: VolumeStatus;
  notes?: string;
  destinationRef?: string;
  salesOrderId?: string;
  customerId?: string;
  closedAt?: Date;
  deliveredAt?: Date;
  returnedAt?: Date;
  closedBy?: string;
  deliveredBy?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  deletedAt?: Date;
}

export class Volume extends Entity<VolumeProps> {
  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get code(): string {
    return this.props.code;
  }

  get name(): string | undefined {
    return this.props.name;
  }

  get status(): VolumeStatus {
    return this.props.status;
  }

  get notes(): string | undefined {
    return this.props.notes;
  }

  get destinationRef(): string | undefined {
    return this.props.destinationRef;
  }

  get salesOrderId(): string | undefined {
    return this.props.salesOrderId;
  }

  get customerId(): string | undefined {
    return this.props.customerId;
  }

  get closedAt(): Date | undefined {
    return this.props.closedAt;
  }

  get deliveredAt(): Date | undefined {
    return this.props.deliveredAt;
  }

  get returnedAt(): Date | undefined {
    return this.props.returnedAt;
  }

  get closedBy(): string | undefined {
    return this.props.closedBy;
  }

  get deliveredBy(): string | undefined {
    return this.props.deliveredBy;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get createdBy(): string {
    return this.props.createdBy;
  }

  get deletedAt(): Date | undefined {
    return this.props.deletedAt;
  }

  set name(value: string | undefined) {
    this.props.name = value;
  }

  set status(value: VolumeStatus) {
    this.props.status = value;
  }

  set notes(value: string | undefined) {
    this.props.notes = value;
  }

  set destinationRef(value: string | undefined) {
    this.props.destinationRef = value;
  }

  set closedAt(value: Date | undefined) {
    this.props.closedAt = value;
  }

  set deliveredAt(value: Date | undefined) {
    this.props.deliveredAt = value;
  }

  set returnedAt(value: Date | undefined) {
    this.props.returnedAt = value;
  }

  set closedBy(value: string | undefined) {
    this.props.closedBy = value;
  }

  set deliveredBy(value: string | undefined) {
    this.props.deliveredBy = value;
  }

  set updatedAt(value: Date) {
    this.props.updatedAt = value;
  }

  set deletedAt(value: Date | undefined) {
    this.props.deletedAt = value;
  }

  static create(
    props: Optional<VolumeProps, 'createdAt' | 'updatedAt'>,
    id?: UniqueEntityID,
  ): Volume {
    const volume = new Volume(
      {
        ...props,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );

    return volume;
  }
}
