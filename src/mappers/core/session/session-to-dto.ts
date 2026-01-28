import type { LoginMethod, Session } from '@/entities/core/session';
import type { DeviceType } from '@/entities/core/value-objects/device-info';

// Device Information DTO
export interface DeviceInfoDTO {
  userAgent?: string;
  deviceType: DeviceType;
  deviceName?: string;
  browserName?: string;
  browserVersion?: string;
  osName?: string;
  osVersion?: string;
  displayName: string;
  isMobile: boolean;
  isBot: boolean;
}

// Geo Location DTO
export interface GeoLocationDTO {
  country?: string;
  countryCode?: string;
  region?: string;
  city?: string;
  timezone?: string;
  latitude?: number;
  longitude?: number;
  displayName: string;
  shortName: string;
}

// Full Session DTO
export interface SessionDTO {
  id: string;
  userId: string;
  ip: string;
  createdAt: Date;
  expiredAt?: Date | null;
  revokedAt?: Date | null;
  lastUsedAt?: Date | null;

  // Device Information
  device: DeviceInfoDTO;

  // Geolocation
  location: GeoLocationDTO;

  // Security & Trust
  isTrusted: boolean;
  trustVerifiedAt?: Date | null;
  loginMethod?: LoginMethod;

  // Computed
  isActive: boolean;
  displayDescription: string;
}

export function sessionToDTO(session: Session): SessionDTO {
  const deviceInfo = session.deviceInfo;
  const geoLocation = session.geoLocation;

  return {
    id: session.id.toString(),
    userId: session.userId.toString(),
    ip: session.ip.toString(),
    createdAt: session.createdAt,
    expiredAt: session.expiredAt ?? null,
    revokedAt: session.revokedAt ?? null,
    lastUsedAt: session.lastUsedAt ?? null,

    // Device Information
    device: {
      userAgent: deviceInfo.userAgent,
      deviceType: deviceInfo.deviceType,
      deviceName: deviceInfo.deviceName,
      browserName: deviceInfo.browserName,
      browserVersion: deviceInfo.browserVersion,
      osName: deviceInfo.osName,
      osVersion: deviceInfo.osVersion,
      displayName: deviceInfo.displayName,
      isMobile: deviceInfo.isMobile,
      isBot: deviceInfo.isBot,
    },

    // Geolocation
    location: {
      country: geoLocation.country,
      countryCode: geoLocation.countryCode,
      region: geoLocation.region,
      city: geoLocation.city,
      timezone: geoLocation.timezone,
      latitude: geoLocation.latitude,
      longitude: geoLocation.longitude,
      displayName: geoLocation.displayName,
      shortName: geoLocation.shortName,
    },

    // Security & Trust
    isTrusted: session.isTrusted,
    trustVerifiedAt: session.trustVerifiedAt ?? null,
    loginMethod: session.loginMethod,

    // Computed
    isActive: session.isActive,
    displayDescription: session.displayDescription,
  };
}
