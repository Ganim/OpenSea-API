/**
 * User Agent Parser Service
 *
 * Serviço para extrair informações do User-Agent string.
 * Extrai: navegador, versão, sistema operacional, tipo de dispositivo.
 */

import {
  DeviceInfo,
  type DeviceType,
} from '@/entities/core/value-objects/device-info';

interface ParsedUserAgent {
  browserName?: string;
  browserVersion?: string;
  osName?: string;
  osVersion?: string;
  deviceType: DeviceType;
  deviceName?: string;
}

// Padrões de navegadores
const BROWSER_PATTERNS: Array<{
  name: string;
  pattern: RegExp;
  versionPattern?: RegExp;
}> = [
  {
    name: 'Edge',
    pattern: /Edg(?:e|A|iOS)?\/(\d+)/i,
    versionPattern: /Edg(?:e|A|iOS)?\/(\d+[\d.]*)/i,
  },
  {
    name: 'Chrome',
    pattern: /Chrome\/(\d+)/i,
    versionPattern: /Chrome\/(\d+[\d.]*)/i,
  },
  {
    name: 'Firefox',
    pattern: /Firefox\/(\d+)/i,
    versionPattern: /Firefox\/(\d+[\d.]*)/i,
  },
  {
    name: 'Safari',
    pattern: /Safari\/(\d+)/i,
    versionPattern: /Version\/(\d+[\d.]*)/i,
  },
  {
    name: 'Opera',
    pattern: /OPR\/(\d+)|Opera\/(\d+)/i,
    versionPattern: /OPR\/(\d+[\d.]*)|Opera\/(\d+[\d.]*)/i,
  },
  {
    name: 'Samsung Browser',
    pattern: /SamsungBrowser\/(\d+)/i,
    versionPattern: /SamsungBrowser\/(\d+[\d.]*)/i,
  },
  {
    name: 'UC Browser',
    pattern: /UCBrowser\/(\d+)/i,
    versionPattern: /UCBrowser\/(\d+[\d.]*)/i,
  },
  {
    name: 'Internet Explorer',
    pattern: /MSIE (\d+)|Trident/i,
    versionPattern: /MSIE (\d+[\d.]*)|rv:(\d+[\d.]*)/i,
  },
];

// Padrões de sistemas operacionais
const OS_PATTERNS: Array<{
  name: string;
  pattern: RegExp;
  versionPattern?: RegExp;
}> = [
  {
    name: 'Windows',
    pattern: /Windows NT/i,
    versionPattern: /Windows NT (\d+\.\d+)/i,
  },
  {
    name: 'macOS',
    pattern: /Mac OS X/i,
    versionPattern: /Mac OS X (\d+[._]\d+)/i,
  },
  {
    name: 'iOS',
    pattern: /iPhone|iPad|iPod/i,
    versionPattern: /OS (\d+[._]\d+)/i,
  },
  {
    name: 'Android',
    pattern: /Android/i,
    versionPattern: /Android (\d+[\d.]*)/i,
  },
  { name: 'Linux', pattern: /Linux/i },
  { name: 'Chrome OS', pattern: /CrOS/i },
];

// Mapeamento de versões do Windows NT
const WINDOWS_VERSIONS: Record<string, string> = {
  '10.0': '10/11',
  '6.3': '8.1',
  '6.2': '8',
  '6.1': '7',
  '6.0': 'Vista',
  '5.1': 'XP',
};

// Padrões de dispositivos móveis
const MOBILE_DEVICES: Array<{ name: string; pattern: RegExp }> = [
  { name: 'iPhone', pattern: /iPhone/i },
  { name: 'iPad', pattern: /iPad/i },
  { name: 'Samsung Galaxy', pattern: /SM-[A-Z]\d+|SAMSUNG/i },
  { name: 'Google Pixel', pattern: /Pixel/i },
  { name: 'OnePlus', pattern: /ONEPLUS/i },
  { name: 'Xiaomi', pattern: /Xiaomi|Redmi|POCO/i },
  { name: 'Huawei', pattern: /HUAWEI|Honor/i },
  { name: 'Motorola', pattern: /moto/i },
  { name: 'LG', pattern: /LG-/i },
  { name: 'Sony Xperia', pattern: /Sony|Xperia/i },
];

// Padrões de bots
const BOT_PATTERNS = [
  /bot/i,
  /crawl/i,
  /spider/i,
  /slurp/i,
  /mediapartners/i,
  /googlebot/i,
  /bingbot/i,
  /yandex/i,
  /baidu/i,
];

export class UserAgentParser {
  /**
   * Faz o parse completo do User-Agent e retorna um DeviceInfo
   */
  static parse(userAgent: string | undefined): DeviceInfo {
    if (!userAgent) {
      return DeviceInfo.empty();
    }

    const parsed = this.parseUserAgent(userAgent);

    return DeviceInfo.create({
      userAgent,
      deviceType: parsed.deviceType,
      deviceName: parsed.deviceName,
      browserName: parsed.browserName,
      browserVersion: parsed.browserVersion,
      osName: parsed.osName,
      osVersion: parsed.osVersion,
    });
  }

  /**
   * Parse interno do User-Agent
   */
  private static parseUserAgent(ua: string): ParsedUserAgent {
    const result: ParsedUserAgent = {
      deviceType: 'unknown',
    };

    // Detecta se é um bot
    if (this.isBot(ua)) {
      result.deviceType = 'bot';
      return result;
    }

    // Detecta navegador
    const browser = this.detectBrowser(ua);
    if (browser) {
      result.browserName = browser.name;
      result.browserVersion = browser.version;
    }

    // Detecta sistema operacional
    const os = this.detectOS(ua);
    if (os) {
      result.osName = os.name;
      result.osVersion = os.version;
    }

    // Detecta tipo de dispositivo e nome
    const device = this.detectDevice(ua);
    result.deviceType = device.type;
    result.deviceName = device.name;

    return result;
  }

  /**
   * Verifica se é um bot/crawler
   */
  private static isBot(ua: string): boolean {
    return BOT_PATTERNS.some((pattern) => pattern.test(ua));
  }

  /**
   * Detecta o navegador
   */
  private static detectBrowser(
    ua: string,
  ): { name: string; version?: string } | null {
    for (const browser of BROWSER_PATTERNS) {
      if (browser.pattern.test(ua)) {
        let version: string | undefined;
        if (browser.versionPattern) {
          const match = ua.match(browser.versionPattern);
          if (match) {
            version = match[1] || match[2];
            // Pega apenas a versão principal
            version = version?.split('.')[0];
          }
        }
        return { name: browser.name, version };
      }
    }
    return null;
  }

  /**
   * Detecta o sistema operacional
   */
  private static detectOS(
    ua: string,
  ): { name: string; version?: string } | null {
    for (const os of OS_PATTERNS) {
      if (os.pattern.test(ua)) {
        let version: string | undefined;
        if (os.versionPattern) {
          const match = ua.match(os.versionPattern);
          if (match) {
            version = match[1]?.replace(/_/g, '.');

            // Converte versão do Windows NT para nome comercial
            if (os.name === 'Windows' && version && WINDOWS_VERSIONS[version]) {
              version = WINDOWS_VERSIONS[version];
            }

            // Para macOS, converte para nome amigável
            if (os.name === 'macOS' && version) {
              const majorVersion = version.split('.')[0];
              version = majorVersion;
            }
          }
        }
        return { name: os.name, version };
      }
    }
    return null;
  }

  /**
   * Detecta o tipo e nome do dispositivo
   */
  private static detectDevice(ua: string): { type: DeviceType; name?: string } {
    // Verifica se é tablet
    if (/iPad|tablet|playbook|silk/i.test(ua) && !/mobile/i.test(ua)) {
      const device = this.detectMobileDevice(ua);
      return { type: 'tablet', name: device };
    }

    // Verifica se é mobile
    if (
      /Mobile|Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        ua,
      )
    ) {
      const device = this.detectMobileDevice(ua);
      return { type: 'mobile', name: device };
    }

    // Desktop
    return { type: 'desktop' };
  }

  /**
   * Detecta o nome do dispositivo móvel
   */
  private static detectMobileDevice(ua: string): string | undefined {
    for (const device of MOBILE_DEVICES) {
      if (device.pattern.test(ua)) {
        return device.name;
      }
    }
    return undefined;
  }
}
