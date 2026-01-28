/**
 * GeoIP Service
 *
 * Serviço para obter informações de geolocalização a partir do endereço IP.
 * Usa uma API pública gratuita (ip-api.com) com fallback para cache local.
 *
 * Limitações do ip-api.com gratuito:
 * - 45 requisições por minuto
 * - Apenas HTTP (HTTPS requer pro)
 *
 * Para produção, considere usar:
 * - MaxMind GeoLite2 (database local)
 * - IP2Location
 * - ipstack.com
 */

import { GeoLocation } from '@/entities/core/value-objects/geo-location';

interface IpApiResponse {
  status: 'success' | 'fail';
  message?: string;
  country?: string;
  countryCode?: string;
  region?: string;
  regionName?: string;
  city?: string;
  zip?: string;
  lat?: number;
  lon?: number;
  timezone?: string;
  isp?: string;
  org?: string;
  as?: string;
  query?: string;
}

// Cache simples em memória para evitar múltiplas requisições para o mesmo IP
const geoCache = new Map<string, { data: GeoLocation; timestamp: number }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 horas

// IPs privados/locais que não devem ser consultados
const PRIVATE_IP_PATTERNS = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
  /^192\.168\./,
  /^::1$/,
  /^localhost$/i,
  /^0\.0\.0\.0$/,
  // IPv6-mapped IPv4 addresses (::ffff:x.x.x.x)
  /^::ffff:127\./i,
  /^::ffff:10\./i,
  /^::ffff:172\.(1[6-9]|2[0-9]|3[0-1])\./i,
  /^::ffff:192\.168\./i,
  /^::ffff:0\.0\.0\.0$/i,
];

export class GeoIpService {
  private static readonly API_URL = 'http://ip-api.com/json';
  private static readonly TIMEOUT_MS = 5000;

  /**
   * Obtém informações de geolocalização para um IP
   * Retorna GeoLocation.empty() para IPs privados ou em caso de erro
   */
  static async lookup(ip: string): Promise<GeoLocation> {
    // Verifica se é IP privado/local
    if (this.isPrivateIp(ip)) {
      return GeoLocation.create({
        country: 'Local Network',
        countryCode: 'LO',
      });
    }

    // Verifica cache
    const cached = this.getFromCache(ip);
    if (cached) {
      return cached;
    }

    try {
      const data = await this.fetchGeoData(ip);

      if (data.status === 'success') {
        const geoLocation = GeoLocation.create({
          country: data.country,
          countryCode: data.countryCode,
          region: data.regionName || data.region,
          city: data.city,
          timezone: data.timezone,
          latitude: data.lat,
          longitude: data.lon,
        });

        // Salva no cache
        this.saveToCache(ip, geoLocation);

        return geoLocation;
      }

      return GeoLocation.empty();
    } catch {
      // Em caso de erro, retorna vazio silenciosamente
      // O erro pode ser rate limit, timeout, etc.
      return GeoLocation.empty();
    }
  }

  /**
   * Lookup síncrono que retorna vazio imediatamente e atualiza em background
   * Útil para não bloquear o fluxo de login
   */
  static lookupSync(ip: string): GeoLocation {
    // Verifica se é IP privado/local
    if (this.isPrivateIp(ip)) {
      return GeoLocation.create({
        country: 'Local Network',
        countryCode: 'LO',
      });
    }

    // Retorna do cache se existir
    const cached = this.getFromCache(ip);
    if (cached) {
      return cached;
    }

    // Inicia lookup em background (fire and forget)
    this.lookup(ip).catch(() => {
      // Ignora erros no background
    });

    return GeoLocation.empty();
  }

  /**
   * Faz a requisição para a API de geolocalização
   */
  private static async fetchGeoData(ip: string): Promise<IpApiResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS);

    try {
      const response = await fetch(
        `${this.API_URL}/${ip}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query`,
        {
          signal: controller.signal,
          headers: {
            Accept: 'application/json',
          },
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      return (await response.json()) as IpApiResponse;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Verifica se é um IP privado/local
   */
  private static isPrivateIp(ip: string): boolean {
    return PRIVATE_IP_PATTERNS.some((pattern) => pattern.test(ip));
  }

  /**
   * Obtém do cache
   */
  private static getFromCache(ip: string): GeoLocation | null {
    const cached = geoCache.get(ip);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }

    // Remove entrada expirada
    if (cached) {
      geoCache.delete(ip);
    }

    return null;
  }

  /**
   * Salva no cache
   */
  private static saveToCache(ip: string, data: GeoLocation): void {
    // Limita tamanho do cache (LRU simples)
    if (geoCache.size > 10000) {
      const firstKey = geoCache.keys().next().value;
      if (firstKey) {
        geoCache.delete(firstKey);
      }
    }

    geoCache.set(ip, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Limpa o cache (útil para testes)
   */
  static clearCache(): void {
    geoCache.clear();
  }
}
