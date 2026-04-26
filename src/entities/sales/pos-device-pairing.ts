import { Entity } from '../domain/entities';
import type { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export type PosPairingSource = 'JWT' | 'PUBLIC';

export interface PosDevicePairingProps {
  id: string;
  tenantId: UniqueEntityID;
  terminalId: UniqueEntityID;
  deviceLabel: string;
  deviceTokenHash: string;
  pairedAt: Date;
  lastSeenAt?: Date;
  appVersion?: string;
  pairedByUserId: string;
  pairingSource: PosPairingSource;
  revokedAt?: Date;
  revokedByUserId?: string;
  revokedReason?: string;
}

export class PosDevicePairing extends Entity<PosDevicePairingProps> {
  get tenantId() {
    return this.props.tenantId;
  }
  get terminalId() {
    return this.props.terminalId;
  }
  get deviceLabel() {
    return this.props.deviceLabel;
  }
  set deviceLabel(value: string) {
    this.props.deviceLabel = value;
  }
  get deviceTokenHash() {
    return this.props.deviceTokenHash;
  }
  get pairedAt() {
    return this.props.pairedAt;
  }
  get lastSeenAt() {
    return this.props.lastSeenAt;
  }
  set lastSeenAt(value: Date | undefined) {
    this.props.lastSeenAt = value;
  }
  get appVersion() {
    return this.props.appVersion;
  }
  set appVersion(value: string | undefined) {
    this.props.appVersion = value;
  }
  get pairedByUserId() {
    return this.props.pairedByUserId;
  }
  get pairingSource(): PosPairingSource {
    return this.props.pairingSource;
  }
  get revokedAt() {
    return this.props.revokedAt;
  }
  get revokedByUserId() {
    return this.props.revokedByUserId;
  }
  get revokedReason() {
    return this.props.revokedReason;
  }
  get pairingId() {
    return this.props.id;
  }

  get isActive(): boolean {
    return !this.props.revokedAt;
  }

  revoke(byUserId: string, reason?: string): void {
    this.props.revokedAt = new Date();
    this.props.revokedByUserId = byUserId;
    this.props.revokedReason = reason;
  }

  static create(
    props: Optional<PosDevicePairingProps, 'id' | 'pairedAt' | 'pairingSource'>,
    id?: UniqueEntityID,
  ) {
    return new PosDevicePairing(
      {
        ...props,
        id: props.id ?? '',
        pairedAt: props.pairedAt ?? new Date(),
        pairingSource: props.pairingSource ?? 'JWT',
      },
      id ?? new UniqueEntityID(props.id),
    );
  }
}
