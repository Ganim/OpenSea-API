import { Entity } from '../domain/entities';
import type { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

import { PosZoneTier } from './value-objects/pos-zone-tier';

export interface PosTerminalZoneProps {
  terminalId: UniqueEntityID;
  zoneId: UniqueEntityID;
  tier: PosZoneTier;
  tenantId: string;
  createdAt: Date;
  updatedAt?: Date;
}

export class PosTerminalZone extends Entity<PosTerminalZoneProps> {
  get terminalId(): UniqueEntityID {
    return this.props.terminalId;
  }

  get zoneId(): UniqueEntityID {
    return this.props.zoneId;
  }

  get tier(): PosZoneTier {
    return this.props.tier;
  }

  set tier(value: PosZoneTier) {
    this.props.tier = value;
    this.touch();
  }

  get tenantId(): string {
    return this.props.tenantId;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date | undefined {
    return this.props.updatedAt;
  }

  private touch() {
    this.props.updatedAt = new Date();
  }

  public static create(
    props: Optional<PosTerminalZoneProps, 'tier' | 'createdAt' | 'updatedAt'>,
    id?: UniqueEntityID,
  ): PosTerminalZone {
    return new PosTerminalZone(
      {
        terminalId: props.terminalId,
        zoneId: props.zoneId,
        tier: props.tier ?? PosZoneTier.PRIMARY(),
        tenantId: props.tenantId,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt,
      },
      id,
    );
  }
}
