import { LoginMethod, Session } from '@/entities/core/session';
import { DeviceInfo, DeviceType } from '@/entities/core/value-objects/device-info';
import { GeoLocation } from '@/entities/core/value-objects/geo-location';
import { IpAddress } from '@/entities/core/value-objects/ip-address';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Prisma } from '@prisma/generated/client.js';

export function mapSessionPrismaToDomain(
  sessionDb: Prisma.SessionGetPayload<object>,
): Session {
  // Map device info from database fields
  const deviceInfo = DeviceInfo.create({
    userAgent: sessionDb.userAgent ?? undefined,
    deviceType: (sessionDb.deviceType as DeviceType) ?? 'unknown',
    deviceName: sessionDb.deviceName ?? undefined,
    browserName: sessionDb.browserName ?? undefined,
    browserVersion: sessionDb.browserVersion ?? undefined,
    osName: sessionDb.osName ?? undefined,
    osVersion: sessionDb.osVersion ?? undefined,
  });

  // Map geo location from database fields
  const geoLocation = GeoLocation.create({
    country: sessionDb.country ?? undefined,
    countryCode: sessionDb.countryCode ?? undefined,
    region: sessionDb.region ?? undefined,
    city: sessionDb.city ?? undefined,
    timezone: sessionDb.timezone ?? undefined,
    latitude: sessionDb.latitude ?? undefined,
    longitude: sessionDb.longitude ?? undefined,
  });

  return Session.create(
    {
      userId: new UniqueEntityID(sessionDb.userId),
      ip: IpAddress.create(sessionDb.ip),
      createdAt: sessionDb.createdAt,
      expiredAt: sessionDb.expiredAt ?? undefined,
      revokedAt: sessionDb.revokedAt ?? undefined,
      lastUsedAt: sessionDb.lastUsedAt ?? undefined,

      // Device & Location
      deviceInfo,
      geoLocation,

      // Security & Trust
      isTrusted: sessionDb.isTrusted ?? false,
      trustVerifiedAt: sessionDb.trustVerifiedAt ?? undefined,
      loginMethod: (sessionDb.loginMethod as LoginMethod) ?? undefined,
    },
    new UniqueEntityID(sessionDb.id),
  );
}
