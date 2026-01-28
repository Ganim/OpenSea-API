/**
 * Device Information Value Object
 *
 * Encapsula informações sobre o dispositivo que iniciou a sessão.
 * Inclui dados do navegador, sistema operacional e tipo de dispositivo.
 */

export type DeviceType = 'desktop' | 'mobile' | 'tablet' | 'bot' | 'unknown';

export interface DeviceInfoProps {
  userAgent?: string;
  deviceType?: DeviceType;
  deviceName?: string;
  browserName?: string;
  browserVersion?: string;
  osName?: string;
  osVersion?: string;
}

export class DeviceInfo {
  private readonly props: DeviceInfoProps;

  private constructor(props: DeviceInfoProps) {
    this.props = props;
  }

  get userAgent(): string | undefined {
    return this.props.userAgent;
  }

  get deviceType(): DeviceType {
    return this.props.deviceType ?? 'unknown';
  }

  get deviceName(): string | undefined {
    return this.props.deviceName;
  }

  get browserName(): string | undefined {
    return this.props.browserName;
  }

  get browserVersion(): string | undefined {
    return this.props.browserVersion;
  }

  get osName(): string | undefined {
    return this.props.osName;
  }

  get osVersion(): string | undefined {
    return this.props.osVersion;
  }

  /**
   * Retorna uma descrição legível do dispositivo
   * Ex: "Chrome 120 on Windows 11" ou "Safari on iPhone"
   */
  get displayName(): string {
    const browser = this.browserName
      ? `${this.browserName}${this.browserVersion ? ` ${this.browserVersion}` : ''}`
      : 'Navegador desconhecido';

    const os = this.osName
      ? `${this.osName}${this.osVersion ? ` ${this.osVersion}` : ''}`
      : 'Sistema desconhecido';

    if (this.deviceName) {
      return `${browser} em ${this.deviceName}`;
    }

    return `${browser} em ${os}`;
  }

  /**
   * Verifica se é um dispositivo móvel
   */
  get isMobile(): boolean {
    return this.deviceType === 'mobile' || this.deviceType === 'tablet';
  }

  /**
   * Verifica se é um bot/crawler
   */
  get isBot(): boolean {
    return this.deviceType === 'bot';
  }

  static create(props: DeviceInfoProps): DeviceInfo {
    return new DeviceInfo({
      userAgent: props.userAgent?.slice(0, 512), // Limita tamanho
      deviceType: props.deviceType ?? 'unknown',
      deviceName: props.deviceName?.slice(0, 128),
      browserName: props.browserName?.slice(0, 64),
      browserVersion: props.browserVersion?.slice(0, 32),
      osName: props.osName?.slice(0, 64),
      osVersion: props.osVersion?.slice(0, 32),
    });
  }

  static empty(): DeviceInfo {
    return new DeviceInfo({});
  }

  toObject(): DeviceInfoProps {
    return { ...this.props };
  }

  equals(other: DeviceInfo): boolean {
    return (
      this.userAgent === other.userAgent &&
      this.deviceType === other.deviceType &&
      this.browserName === other.browserName &&
      this.osName === other.osName
    );
  }
}
