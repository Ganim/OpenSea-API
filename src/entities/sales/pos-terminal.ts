import { randomBytes } from 'node:crypto';
import { Entity } from '../domain/entities';
import type { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';
import { PosCoordinationMode } from './value-objects/pos-coordination-mode';
import { PosOperatorSessionMode } from './value-objects/pos-operator-session-mode';

export type PosTerminalMode =
  | 'SALES_ONLY'
  | 'SALES_WITH_CHECKOUT'
  | 'CASHIER'
  | 'TOTEM';

export interface PosTerminalProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  terminalName: string;
  terminalCode: string;
  totemCode?: string;
  mode: PosTerminalMode;
  acceptsPendingOrders: boolean;
  requiresSession: boolean;
  allowAnonymous: boolean;
  systemUserId?: string;
  pairingSecret?: string;
  defaultPriceTableId?: UniqueEntityID;
  isActive: boolean;
  deletedAt?: Date;
  lastSyncAt?: Date;
  lastOnlineAt?: Date;
  settings?: Record<string, unknown>;
  // Fase 1 (Emporion) — operator session + coordination + applied profile
  operatorSessionMode: PosOperatorSessionMode;
  operatorSessionTimeout?: number | null;
  autoCloseSessionAt?: string | null;
  coordinationMode: PosCoordinationMode;
  appliedProfileId?: UniqueEntityID | null;
  createdAt: Date;
  updatedAt?: Date;
}

export class PosTerminal extends Entity<PosTerminalProps> {
  get tenantId() {
    return this.props.tenantId;
  }
  get terminalName() {
    return this.props.terminalName;
  }
  set terminalName(value: string) {
    this.props.terminalName = value;
  }
  get terminalCode() {
    return this.props.terminalCode;
  }
  set terminalCode(value: string) {
    this.props.terminalCode = value;
  }
  get totemCode() {
    return this.props.totemCode;
  }
  set totemCode(value: string | undefined) {
    this.props.totemCode = value;
  }
  get mode() {
    return this.props.mode;
  }
  set mode(value: PosTerminalMode) {
    this.props.mode = value;
  }
  get acceptsPendingOrders() {
    return this.props.acceptsPendingOrders;
  }
  set acceptsPendingOrders(value: boolean) {
    this.props.acceptsPendingOrders = value;
  }
  get requiresSession() {
    return this.props.requiresSession;
  }
  set requiresSession(value: boolean) {
    this.props.requiresSession = value;
  }
  get allowAnonymous() {
    return this.props.allowAnonymous;
  }
  set allowAnonymous(value: boolean) {
    this.props.allowAnonymous = value;
  }
  get systemUserId() {
    return this.props.systemUserId;
  }
  set systemUserId(value: string | undefined) {
    this.props.systemUserId = value;
  }
  get pairingSecret() {
    return this.props.pairingSecret;
  }
  set pairingSecret(value: string | undefined) {
    this.props.pairingSecret = value;
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
  get deletedAt() {
    return this.props.deletedAt;
  }
  set deletedAt(value: Date | undefined) {
    this.props.deletedAt = value;
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

  // Fase 1 (Emporion) — operator session + coordination
  get operatorSessionMode(): PosOperatorSessionMode {
    return this.props.operatorSessionMode;
  }
  set operatorSessionMode(value: PosOperatorSessionMode) {
    this.props.operatorSessionMode = value;
  }
  get operatorSessionTimeout(): number | null | undefined {
    return this.props.operatorSessionTimeout;
  }
  set operatorSessionTimeout(value: number | null | undefined) {
    this.props.operatorSessionTimeout = value;
  }
  get autoCloseSessionAt(): string | null | undefined {
    return this.props.autoCloseSessionAt;
  }
  set autoCloseSessionAt(value: string | null | undefined) {
    this.props.autoCloseSessionAt = value;
  }
  get coordinationMode(): PosCoordinationMode {
    return this.props.coordinationMode;
  }
  set coordinationMode(value: PosCoordinationMode) {
    this.props.coordinationMode = value;
  }
  get appliedProfileId(): UniqueEntityID | null | undefined {
    return this.props.appliedProfileId;
  }
  set appliedProfileId(value: UniqueEntityID | null | undefined) {
    this.props.appliedProfileId = value;
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
      | 'id'
      | 'createdAt'
      | 'isActive'
      | 'acceptsPendingOrders'
      | 'requiresSession'
      | 'allowAnonymous'
      | 'operatorSessionMode'
      | 'operatorSessionTimeout'
      | 'autoCloseSessionAt'
      | 'coordinationMode'
      | 'appliedProfileId'
    >,
    id?: UniqueEntityID,
  ) {
    return new PosTerminal(
      {
        ...props,
        id: props.id ?? new UniqueEntityID(),
        isActive: props.isActive ?? true,
        acceptsPendingOrders: props.acceptsPendingOrders ?? false,
        requiresSession: props.requiresSession ?? true,
        allowAnonymous: props.allowAnonymous ?? false,
        pairingSecret: props.pairingSecret ?? randomBytes(32).toString('hex'),
        operatorSessionMode:
          props.operatorSessionMode ?? PosOperatorSessionMode.PER_SALE(),
        operatorSessionTimeout: props.operatorSessionTimeout ?? null,
        autoCloseSessionAt: props.autoCloseSessionAt ?? null,
        coordinationMode:
          props.coordinationMode ?? PosCoordinationMode.STANDALONE(),
        appliedProfileId: props.appliedProfileId ?? null,
        createdAt: props.createdAt ?? new Date(),
      },
      id ?? props.id,
    );
  }
}
