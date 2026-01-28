/**
 * Session Info Service
 *
 * Serviço que combina parsing de User-Agent e GeoIP para criar
 * informações completas de contexto da sessão.
 */

import { DeviceInfo } from '@/entities/core/value-objects/device-info';
import { GeoLocation } from '@/entities/core/value-objects/geo-location';
import { GeoIpService } from './geo-ip-service';
import { UserAgentParser } from './user-agent-parser';

export interface SessionContext {
  deviceInfo: DeviceInfo;
  geoLocation: GeoLocation;
}

export interface SessionContextInput {
  userAgent?: string;
  ip: string;
}

export class SessionInfoService {
  /**
   * Obtém o contexto completo da sessão de forma assíncrona
   * Inclui informações de dispositivo e geolocalização
   */
  static async getSessionContext(input: SessionContextInput): Promise<SessionContext> {
    const [deviceInfo, geoLocation] = await Promise.all([
      Promise.resolve(UserAgentParser.parse(input.userAgent)),
      GeoIpService.lookup(input.ip),
    ]);

    return {
      deviceInfo,
      geoLocation,
    };
  }

  /**
   * Obtém o contexto da sessão de forma síncrona
   * A geolocalização pode ser vazia inicialmente e atualizada em background
   */
  static getSessionContextSync(input: SessionContextInput): SessionContext {
    return {
      deviceInfo: UserAgentParser.parse(input.userAgent),
      geoLocation: GeoIpService.lookupSync(input.ip),
    };
  }

  /**
   * Cria apenas DeviceInfo a partir do User-Agent
   */
  static parseUserAgent(userAgent?: string): DeviceInfo {
    return UserAgentParser.parse(userAgent);
  }

  /**
   * Obtém apenas GeoLocation a partir do IP
   */
  static async lookupGeoLocation(ip: string): Promise<GeoLocation> {
    return GeoIpService.lookup(ip);
  }
}
