import { Session } from '@/entities/core/session';
import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { prisma } from '@/lib/prisma';
import { mapSessionPrismaToDomain } from '@/mappers/core/session/session-prisma-to-domain';
import {
  CreateSessionSchema,
  SessionsRepository,
  TrustSessionSchema,
  UpdateSessionSchema,
} from '../sessions-repository';

export class PrismaSessionsRepository implements SessionsRepository {
  // CREATE
  // - create(data: CreateSessionSchema): Promise<Session>;

  async create(data: CreateSessionSchema): Promise<Session> {
    const deviceInfo = data.deviceInfo;
    const geoLocation = data.geoLocation;

    const sessionDb = await prisma.session.create({
      data: {
        userId: data.userId.toString(),
        ip: data.ip.value,
        createdAt: new Date(),

        // Device Information
        userAgent: deviceInfo?.userAgent,
        deviceType: deviceInfo?.deviceType,
        deviceName: deviceInfo?.deviceName,
        browserName: deviceInfo?.browserName,
        browserVersion: deviceInfo?.browserVersion,
        osName: deviceInfo?.osName,
        osVersion: deviceInfo?.osVersion,

        // Geolocation
        country: geoLocation?.country,
        countryCode: geoLocation?.countryCode,
        region: geoLocation?.region,
        city: geoLocation?.city,
        timezone: geoLocation?.timezone,
        latitude: geoLocation?.latitude,
        longitude: geoLocation?.longitude,

        // Security
        loginMethod: data.loginMethod,
        isTrusted: false,
      },
    });
    return mapSessionPrismaToDomain(sessionDb);
  }

  // UPDATE / PATCH
  // - update(data: UpdateSessionSchema): Promise<Session | null>;
  async update(data: UpdateSessionSchema): Promise<Session | null> {
    const sessionDb = await prisma.session.findUnique({
      where: { id: data.sessionId.toString() },
    });
    if (!sessionDb) return null;

    const deviceInfo = data.deviceInfo;
    const geoLocation = data.geoLocation;

    const updatedSessionDb = await prisma.session.update({
      where: { id: data.sessionId.toString() },
      data: {
        ip: data.ip.value,
        lastUsedAt: new Date(),

        // Update device info if provided
        ...(deviceInfo && {
          userAgent: deviceInfo.userAgent,
          deviceType: deviceInfo.deviceType,
          deviceName: deviceInfo.deviceName,
          browserName: deviceInfo.browserName,
          browserVersion: deviceInfo.browserVersion,
          osName: deviceInfo.osName,
          osVersion: deviceInfo.osVersion,
        }),

        // Update geo location if provided
        ...(geoLocation && {
          country: geoLocation.country,
          countryCode: geoLocation.countryCode,
          region: geoLocation.region,
          city: geoLocation.city,
          timezone: geoLocation.timezone,
          latitude: geoLocation.latitude,
          longitude: geoLocation.longitude,
        }),
      },
    });

    return mapSessionPrismaToDomain(updatedSessionDb);
  }

  // - setTrust(data: TrustSessionSchema): Promise<Session | null>;
  async setTrust(data: TrustSessionSchema): Promise<Session | null> {
    const sessionDb = await prisma.session.findUnique({
      where: { id: data.sessionId.toString() },
    });
    if (!sessionDb) return null;

    const updatedSessionDb = await prisma.session.update({
      where: { id: data.sessionId.toString() },
      data: {
        isTrusted: data.trusted,
        trustVerifiedAt: data.trusted ? new Date() : null,
      },
    });

    return mapSessionPrismaToDomain(updatedSessionDb);
  }

  // DELETE
  //  - revoke(sessionId: UniqueEntityID): Promise<void | null>;
  //  - expire(sessionId: UniqueEntityID): Promise<void | null>;

  async revoke(sessionId: UniqueEntityID): Promise<void | null> {
    const sessionDb = await prisma.session.findUnique({
      where: { id: sessionId.toString() },
    });
    if (!sessionDb) return null;

    await prisma.session.update({
      where: { id: sessionId.toString() },
      data: { revokedAt: new Date() },
    });
  }

  async expire(sessionId: UniqueEntityID): Promise<void | null> {
    const sessionDb = await prisma.session.findUnique({
      where: { id: sessionId.toString() },
    });
    if (!sessionDb) return null;

    await prisma.session.update({
      where: { id: sessionId.toString() },
      data: { expiredAt: new Date() },
    });
  }

  // RETRIEVE
  // - findById(sessionId: UniqueEntityID): Promise<Session | null>;

  async findById(sessionId: UniqueEntityID): Promise<Session | null> {
    const sessionDb = await prisma.session.findUnique({
      where: { id: sessionId.toString() },
    });
    return sessionDb ? mapSessionPrismaToDomain(sessionDb) : null;
  }

  // LIST
  // - listAllActive(): Promise<Session[] | null>;
  // - listByUser(userId: UniqueEntityID): Promise<Session[] | null>;
  // - listByUserAndDate(userId: UniqueEntityID, from: Date, to: Date): Promise<Session[] | null>;

  async listAllActive(): Promise<Session[] | null> {
    const sessionsDb = await prisma.session.findMany({
      where: {
        expiredAt: null,
        revokedAt: null,
      },
    });

    if (sessionsDb.length === 0) return null;

    return sessionsDb.map(mapSessionPrismaToDomain);
  }

  async listByUser(userId: UniqueEntityID): Promise<Session[] | null> {
    const sessionsDb = await prisma.session.findMany({
      where: { userId: userId.toString() },
    });

    if (sessionsDb.length === 0) return null;

    return sessionsDb.map(mapSessionPrismaToDomain);
  }

  async listByUserAndDate(
    userId: UniqueEntityID,
    from: Date,
    to: Date,
  ): Promise<Session[] | null> {
    const sessionsDb = await prisma.session.findMany({
      where: {
        userId: userId.toString(),
        createdAt: {
          gte: from,
          lte: to,
        },
      },
    });

    if (sessionsDb.length === 0) return null;

    return sessionsDb.map(mapSessionPrismaToDomain);
  }
}
