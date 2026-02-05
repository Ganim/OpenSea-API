import type { LoginMethod, Session } from '@/entities/core/session';
import type { DeviceInfo } from '@/entities/core/value-objects/device-info';
import type { GeoLocation } from '@/entities/core/value-objects/geo-location';
import type { IpAddress } from '@/entities/core/value-objects/ip-address';
import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';

export interface CreateSessionSchema {
  userId: UniqueEntityID;
  ip: IpAddress;

  // Device & Location (optional, will be populated by service)
  deviceInfo?: DeviceInfo;
  geoLocation?: GeoLocation;

  // Security
  loginMethod?: LoginMethod;
}

export interface UpdateSessionSchema {
  sessionId: UniqueEntityID;
  ip: IpAddress;

  // Optional updates
  deviceInfo?: DeviceInfo;
  geoLocation?: GeoLocation;
  tenantId?: UniqueEntityID | null;
}

export interface TrustSessionSchema {
  sessionId: UniqueEntityID;
  trusted: boolean;
}

export interface SetTenantSessionSchema {
  sessionId: UniqueEntityID;
  tenantId: UniqueEntityID | null;
}

export interface SessionsRepository {
  // CREATE
  create(data: CreateSessionSchema): Promise<Session>;

  // UPDATE / PATCH
  update(data: UpdateSessionSchema): Promise<Session | null>;
  setTenant(data: SetTenantSessionSchema): Promise<Session | null>;
  setTrust(data: TrustSessionSchema): Promise<Session | null>;

  // DELETE
  revoke(sessionId: UniqueEntityID): Promise<void | null>;
  expire(sessionId: UniqueEntityID): Promise<void | null>;

  // RETRIEVE
  findById(sessionId: UniqueEntityID): Promise<Session | null>;

  // LIST
  listAllActive(): Promise<Session[] | null>;
  listByUser(userId: UniqueEntityID): Promise<Session[] | null>;
  listByUserAndDate(
    userId: UniqueEntityID,
    from: Date,
    to: Date,
  ): Promise<Session[] | null>;
}
