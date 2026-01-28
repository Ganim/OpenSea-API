import { Entity } from '../domain/entities';
import type { UniqueEntityID } from '../domain/unique-entity-id';
import { DeviceInfo } from './value-objects/device-info';
import { GeoLocation } from './value-objects/geo-location';
import { IpAddress } from './value-objects/ip-address';

export type LoginMethod = 'password' | 'oauth' | 'magic_link' | 'api_key';

export interface SessionProps {
  userId: UniqueEntityID;
  ip: IpAddress;
  createdAt: Date;
  expiredAt?: Date | null;
  revokedAt?: Date | null;
  lastUsedAt?: Date | null;

  // Device Information
  deviceInfo?: DeviceInfo;

  // Geolocation
  geoLocation?: GeoLocation;

  // Security & Trust
  isTrusted?: boolean;
  trustVerifiedAt?: Date | null;
  loginMethod?: LoginMethod;
}

export class Session extends Entity<SessionProps> {
  get userId(): UniqueEntityID {
    return this.props.userId;
  }

  get ip(): IpAddress {
    return this.props.ip;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get expiredAt(): Date | null {
    return this.props.expiredAt ?? null;
  }

  get revokedAt(): Date | null {
    return this.props.revokedAt ?? null;
  }

  get lastUsedAt(): Date | null {
    return this.props.lastUsedAt ?? null;
  }

  // Device Information
  get deviceInfo(): DeviceInfo {
    return this.props.deviceInfo ?? DeviceInfo.empty();
  }

  // Geolocation
  get geoLocation(): GeoLocation {
    return this.props.geoLocation ?? GeoLocation.empty();
  }

  // Security & Trust
  get isTrusted(): boolean {
    return this.props.isTrusted ?? false;
  }

  get trustVerifiedAt(): Date | null {
    return this.props.trustVerifiedAt ?? null;
  }

  get loginMethod(): LoginMethod | undefined {
    return this.props.loginMethod;
  }

  // Computed properties
  get isRevoked(): boolean {
    return !!this.revokedAt;
  }

  get isExpired(): boolean {
    return this.expiredAt ? new Date() > this.expiredAt : false;
  }

  get isActive(): boolean {
    return !this.isRevoked && !this.isExpired;
  }

  /**
   * Retorna uma descrição legível da sessão
   * Ex: "Chrome 120 em Windows 11 - São Paulo, BR"
   */
  get displayDescription(): string {
    const device = this.deviceInfo.displayName;
    const location = this.geoLocation.shortName;

    if (location !== 'Desconhecido') {
      return `${device} - ${location}`;
    }

    return device;
  }

  // Setters
  set ip(ip: IpAddress) {
    this.props.ip = ip;
  }

  set createdAt(createdAt: Date) {
    this.props.createdAt = createdAt;
  }

  set expiredAt(expiredAt: Date | null) {
    this.props.expiredAt = expiredAt;
  }

  set revokedAt(date: Date | null) {
    this.props.revokedAt = date;
  }

  set lastUsedAt(date: Date | null) {
    this.props.lastUsedAt = date;
  }

  set deviceInfo(deviceInfo: DeviceInfo) {
    this.props.deviceInfo = deviceInfo;
  }

  set geoLocation(geoLocation: GeoLocation) {
    this.props.geoLocation = geoLocation;
  }

  set isTrusted(value: boolean) {
    this.props.isTrusted = value;
    if (value && !this.props.trustVerifiedAt) {
      this.props.trustVerifiedAt = new Date();
    }
  }

  set trustVerifiedAt(date: Date | null) {
    this.props.trustVerifiedAt = date;
  }

  set loginMethod(method: LoginMethod | undefined) {
    this.props.loginMethod = method;
  }

  /**
   * Marca o dispositivo como confiável
   */
  markAsTrusted(): void {
    this.props.isTrusted = true;
    this.props.trustVerifiedAt = new Date();
  }

  /**
   * Remove a marcação de confiança do dispositivo
   */
  removeTrust(): void {
    this.props.isTrusted = false;
    this.props.trustVerifiedAt = null;
  }

  static create(props: SessionProps, id?: UniqueEntityID) {
    return new Session(
      {
        ...props,
        expiredAt: props.expiredAt ?? null,
        revokedAt: props.revokedAt ?? null,
        lastUsedAt: props.lastUsedAt ?? null,
        deviceInfo: props.deviceInfo ?? DeviceInfo.empty(),
        geoLocation: props.geoLocation ?? GeoLocation.empty(),
        isTrusted: props.isTrusted ?? false,
        trustVerifiedAt: props.trustVerifiedAt ?? null,
        loginMethod: props.loginMethod,
      },
      id,
    );
  }
}
