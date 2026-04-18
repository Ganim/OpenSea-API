import { randomBytes } from 'node:crypto';
import { Entity } from '../domain/entities';
import type { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

/**
 * Tipos de dispositivo de ponto (PUNCH-CORE-01).
 *
 * Alinhados com os canais de captura do Sistema de Ponto v2.0:
 * - `PWA_PERSONAL`: PWA instalado no dispositivo pessoal do funcionário
 * - `KIOSK_PUBLIC`: terminal compartilhado (padrão Tangerino)
 * - `BIOMETRIC_READER`: leitor biométrico (Tauri + Nitgen/DigitalPersona)
 * - `WEBAUTHN_PC`: PC com WebAuthn (leitor biométrico embutido)
 */
export type PunchDeviceKind =
  | 'PWA_PERSONAL'
  | 'KIOSK_PUBLIC'
  | 'BIOMETRIC_READER'
  | 'WEBAUTHN_PC';

/**
 * Status operacional do dispositivo de ponto.
 *
 * Alias semântico do enum Prisma `AgentStatus` (AD-04). Reutilizamos o enum
 * já existente (`ONLINE` / `OFFLINE` / `ERROR`) em vez de criar um
 * `PunchDeviceStatus` novo — os estados são idênticos aos do `PrintAgent` e
 * a duplicação seria pura cerimônia.
 */
export type PunchDeviceStatus = 'ONLINE' | 'OFFLINE' | 'ERROR';

export interface PunchDeviceProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  name: string;
  deviceKind: PunchDeviceKind;
  pairingSecret: string;
  deviceTokenHash?: string;
  deviceLabel?: string;
  geofenceZoneId?: UniqueEntityID;
  pairedAt?: Date;
  pairedByUserId?: string;
  revokedAt?: Date;
  revokedByUserId?: string;
  revokedReason?: string;
  status: PunchDeviceStatus;
  lastSeenAt?: Date;
  ipAddress?: string;
  hostname?: string;
  osInfo?: Record<string, unknown>;
  version?: string;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export class PunchDevice extends Entity<PunchDeviceProps> {
  get tenantId() {
    return this.props.tenantId;
  }

  get name() {
    return this.props.name;
  }

  set name(value: string) {
    this.props.name = value;
    this.touch();
  }

  get deviceKind() {
    return this.props.deviceKind;
  }

  get pairingSecret() {
    return this.props.pairingSecret;
  }

  get deviceTokenHash() {
    return this.props.deviceTokenHash;
  }

  get deviceLabel() {
    return this.props.deviceLabel;
  }

  get geofenceZoneId() {
    return this.props.geofenceZoneId;
  }

  set geofenceZoneId(value: UniqueEntityID | undefined) {
    this.props.geofenceZoneId = value;
    this.touch();
  }

  get pairedAt() {
    return this.props.pairedAt;
  }

  get pairedByUserId() {
    return this.props.pairedByUserId;
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

  /**
   * Um dispositivo está pareado quando tem um `deviceTokenHash` ativo E
   * nunca foi revogado. Revogar e repair limpa `revokedAt` explicitamente.
   */
  get isPaired(): boolean {
    return !!this.props.deviceTokenHash && !this.props.revokedAt;
  }

  get status() {
    return this.props.status;
  }

  set status(value: PunchDeviceStatus) {
    this.props.status = value;
    this.touch();
  }

  get lastSeenAt() {
    return this.props.lastSeenAt;
  }

  get ipAddress() {
    return this.props.ipAddress;
  }

  get hostname() {
    return this.props.hostname;
  }

  get osInfo() {
    return this.props.osInfo;
  }

  set osInfo(value: Record<string, unknown> | undefined) {
    this.props.osInfo = value;
    this.touch();
  }

  get version() {
    return this.props.version;
  }

  set version(value: string | undefined) {
    this.props.version = value;
    this.touch();
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get updatedAt() {
    return this.props.updatedAt;
  }

  get deletedAt() {
    return this.props.deletedAt;
  }

  set deletedAt(value: Date | undefined) {
    this.props.deletedAt = value;
    this.touch();
  }

  /**
   * Finaliza o pareamento: associa o hash do token opaco (nunca armazenamos
   * o token em texto plano), o label de UI e o usuário que executou o pair.
   *
   * Também limpa `revokedAt` / `revokedByUserId` / `revokedReason` para
   * suportar o fluxo "revogar e repair" na mesma entidade (embora o fluxo
   * padrão do plan seja criar um novo PunchDevice após revogação).
   */
  pair(deviceTokenHash: string, deviceLabel: string, pairedByUserId?: string) {
    this.props.deviceTokenHash = deviceTokenHash;
    this.props.deviceLabel = deviceLabel;
    this.props.pairedAt = new Date();
    if (pairedByUserId) {
      this.props.pairedByUserId = pairedByUserId;
    }
    this.props.revokedAt = undefined;
    this.props.revokedByUserId = undefined;
    this.props.revokedReason = undefined;
    this.touch();
  }

  /**
   * Revoga o dispositivo. Portaria 671 e PUNCH-CORE-08 exigem que a
   * revogação seja instantânea (< 5s). Preservamos `deviceTokenHash` para
   * auditoria: quem era o token que foi revogado. O middleware
   * `verifyPunchDeviceToken` (Plan 3) filtra por `revokedAt IS NULL`.
   */
  revoke(revokedByUserId: string, reason?: string) {
    this.props.revokedAt = new Date();
    this.props.revokedByUserId = revokedByUserId;
    this.props.revokedReason = reason;
    this.touch();
  }

  recordHeartbeat(ipAddress?: string, hostname?: string) {
    this.props.lastSeenAt = new Date();
    this.props.ipAddress = ipAddress ?? this.props.ipAddress;
    this.props.hostname = hostname ?? this.props.hostname;
    this.props.status = 'ONLINE';
    this.touch();
  }

  markOffline() {
    this.props.status = 'OFFLINE';
    this.touch();
  }

  private touch() {
    this.props.updatedAt = new Date();
  }

  static create(
    props: Optional<
      PunchDeviceProps,
      'id' | 'createdAt' | 'status' | 'pairingSecret'
    >,
    id?: UniqueEntityID,
  ) {
    return new PunchDevice(
      {
        ...props,
        id: props.id ?? new UniqueEntityID(),
        pairingSecret: props.pairingSecret ?? randomBytes(32).toString('hex'),
        status: props.status ?? 'OFFLINE',
        createdAt: props.createdAt ?? new Date(),
      },
      id ?? props.id,
    );
  }
}
