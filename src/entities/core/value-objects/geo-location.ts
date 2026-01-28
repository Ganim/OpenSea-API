/**
 * Geo Location Value Object
 *
 * Encapsula informações de geolocalização baseadas no IP.
 * Inclui país, região, cidade, timezone e coordenadas.
 */

export interface GeoLocationProps {
  country?: string;
  countryCode?: string;
  region?: string;
  city?: string;
  timezone?: string;
  latitude?: number;
  longitude?: number;
}

export class GeoLocation {
  private readonly props: GeoLocationProps;

  private constructor(props: GeoLocationProps) {
    this.props = props;
  }

  get country(): string | undefined {
    return this.props.country;
  }

  get countryCode(): string | undefined {
    return this.props.countryCode;
  }

  get region(): string | undefined {
    return this.props.region;
  }

  get city(): string | undefined {
    return this.props.city;
  }

  get timezone(): string | undefined {
    return this.props.timezone;
  }

  get latitude(): number | undefined {
    return this.props.latitude;
  }

  get longitude(): number | undefined {
    return this.props.longitude;
  }

  /**
   * Retorna uma descrição legível da localização
   * Ex: "São Paulo, SP, Brazil" ou "San Francisco, CA, United States"
   */
  get displayName(): string {
    const parts: string[] = [];

    if (this.city) parts.push(this.city);
    if (this.region) parts.push(this.region);
    if (this.country) parts.push(this.country);

    return parts.length > 0 ? parts.join(', ') : 'Localização desconhecida';
  }

  /**
   * Retorna localização curta (cidade, país)
   */
  get shortName(): string {
    if (this.city && this.countryCode) {
      return `${this.city}, ${this.countryCode}`;
    }
    if (this.country) {
      return this.country;
    }
    return 'Desconhecido';
  }

  /**
   * Verifica se tem coordenadas GPS
   */
  get hasCoordinates(): boolean {
    return this.latitude !== undefined && this.longitude !== undefined;
  }

  /**
   * Retorna coordenadas como objeto
   */
  get coordinates(): { lat: number; lng: number } | null {
    if (!this.hasCoordinates) return null;
    return {
      lat: this.latitude!,
      lng: this.longitude!,
    };
  }

  static create(props: GeoLocationProps): GeoLocation {
    return new GeoLocation({
      country: props.country?.slice(0, 64),
      countryCode: props.countryCode?.toUpperCase().slice(0, 2),
      region: props.region?.slice(0, 64),
      city: props.city?.slice(0, 64),
      timezone: props.timezone?.slice(0, 64),
      latitude: props.latitude,
      longitude: props.longitude,
    });
  }

  static empty(): GeoLocation {
    return new GeoLocation({});
  }

  toObject(): GeoLocationProps {
    return { ...this.props };
  }

  equals(other: GeoLocation): boolean {
    return (
      this.country === other.country &&
      this.countryCode === other.countryCode &&
      this.city === other.city
    );
  }
}
