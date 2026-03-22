import { Entity } from '../domain/entities';
import type { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export type PosTerminalMode =
  | 'FAST_CHECKOUT'
  | 'CONSULTIVE'
  | 'SELF_SERVICE'
  | 'EXTERNAL';

export type PosCashierMode = 'INTEGRATED' | 'SEPARATED';

export interface PosTerminalProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  name: string;
  deviceId: string;
  mode: PosTerminalMode;
  cashierMode: PosCashierMode;
  acceptsPendingOrders: boolean;
  warehouseId: UniqueEntityID;
  defaultPriceTableId?: UniqueEntityID;
  isActive: boolean;
  lastSyncAt?: Date;
  lastOnlineAt?: Date;
  settings?: Record<string, unknown>;
  createdAt: Date;
  updatedAt?: Date;
}

export class PosTerminal extends Entity<PosTerminalProps> {
  get tenantId() {
    return this.props.tenantId;
  }
  get name() {
    return this.props.name;
  }
  set name(value: string) {
    this.props.name = value;
  }
  get deviceId() {
    return this.props.deviceId;
  }
  set deviceId(value: string) {
    this.props.deviceId = value;
  }
  get mode() {
    return this.props.mode;
  }
  set mode(value: PosTerminalMode) {
    this.props.mode = value;
  }
  get cashierMode() {
    return this.props.cashierMode;
  }
  set cashierMode(value: PosCashierMode) {
    this.props.cashierMode = value;
  }
  get acceptsPendingOrders() {
    return this.props.acceptsPendingOrders;
  }
  set acceptsPendingOrders(value: boolean) {
    this.props.acceptsPendingOrders = value;
  }
  get warehouseId() {
    return this.props.warehouseId;
  }
  set warehouseId(value: UniqueEntityID) {
    this.props.warehouseId = value;
  }
  get defaultPriceTableId() {
    return this.props.defaultPriceTableId;
  }
  set defaultPriceTableId(value: UniqueEntityID | undefined) {
    this.props.defaultPriceTableId = value;
  }
  get isActive() {
    return this.props.isActive;
  }
  set isActive(value: boolean) {
    this.props.isActive = value;
  }
  get lastSyncAt() {
    return this.props.lastSyncAt;
  }
  set lastSyncAt(value: Date | undefined) {
    this.props.lastSyncAt = value;
  }
  get lastOnlineAt() {
    return this.props.lastOnlineAt;
  }
  set lastOnlineAt(value: Date | undefined) {
    this.props.lastOnlineAt = value;
  }
  get settings() {
    return this.props.settings;
  }
  set settings(value: Record<string, unknown> | undefined) {
    this.props.settings = value;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get updatedAt() {
    return this.props.updatedAt;
  }

  static create(
    props: Optional<
      PosTerminalProps,
      'id' | 'createdAt' | 'isActive' | 'cashierMode' | 'acceptsPendingOrders'
    >,
    id?: UniqueEntityID,
  ) {
    return new PosTerminal(
      {
        ...props,
        id: props.id ?? new UniqueEntityID(),
        isActive: props.isActive ?? true,
        cashierMode: props.cashierMode ?? 'INTEGRATED',
        acceptsPendingOrders: props.acceptsPendingOrders ?? false,
        createdAt: props.createdAt ?? new Date(),
      },
      id ?? props.id,
    );
  }
}
