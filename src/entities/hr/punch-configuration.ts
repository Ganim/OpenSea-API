import { Entity } from '../domain/entities';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface PunchConfigurationProps {
  tenantId: string;

  // Authentication methods
  selfieRequired: boolean;
  gpsRequired: boolean;
  geofenceEnabled: boolean;
  qrCodeEnabled: boolean;

  // Access methods
  directLoginEnabled: boolean;
  kioskModeEnabled: boolean;
  pwaEnabled: boolean;

  // Rules
  offlineAllowed: boolean;
  maxOfflineHours: number;
  toleranceMinutes: number;
  autoClockOutHours: number | null;

  // Receipt
  pdfReceiptEnabled: boolean;

  // Geofence defaults
  defaultRadiusMeters: number;

  // Audit
  createdAt: Date;
  updatedAt: Date;
}

export class PunchConfiguration extends Entity<PunchConfigurationProps> {
  get tenantId(): string {
    return this.props.tenantId;
  }

  get selfieRequired(): boolean {
    return this.props.selfieRequired;
  }

  get gpsRequired(): boolean {
    return this.props.gpsRequired;
  }

  get geofenceEnabled(): boolean {
    return this.props.geofenceEnabled;
  }

  get qrCodeEnabled(): boolean {
    return this.props.qrCodeEnabled;
  }

  get directLoginEnabled(): boolean {
    return this.props.directLoginEnabled;
  }

  get kioskModeEnabled(): boolean {
    return this.props.kioskModeEnabled;
  }

  get pwaEnabled(): boolean {
    return this.props.pwaEnabled;
  }

  get offlineAllowed(): boolean {
    return this.props.offlineAllowed;
  }

  get maxOfflineHours(): number {
    return this.props.maxOfflineHours;
  }

  get toleranceMinutes(): number {
    return this.props.toleranceMinutes;
  }

  get autoClockOutHours(): number | null {
    return this.props.autoClockOutHours;
  }

  get pdfReceiptEnabled(): boolean {
    return this.props.pdfReceiptEnabled;
  }

  get defaultRadiusMeters(): number {
    return this.props.defaultRadiusMeters;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  private constructor(props: PunchConfigurationProps, id?: UniqueEntityID) {
    super(props, id);
  }

  static create(
    props: Omit<PunchConfigurationProps, 'createdAt' | 'updatedAt'> &
      Partial<Pick<PunchConfigurationProps, 'createdAt' | 'updatedAt'>>,
    id?: UniqueEntityID,
  ): PunchConfiguration {
    return new PunchConfiguration(
      {
        ...props,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );
  }

  static createDefault(tenantId: string): PunchConfiguration {
    return PunchConfiguration.create({
      tenantId,
      selfieRequired: true,
      gpsRequired: true,
      geofenceEnabled: false,
      qrCodeEnabled: true,
      directLoginEnabled: true,
      kioskModeEnabled: false,
      pwaEnabled: true,
      offlineAllowed: false,
      maxOfflineHours: 24,
      toleranceMinutes: 10,
      autoClockOutHours: null,
      pdfReceiptEnabled: true,
      defaultRadiusMeters: 200,
    });
  }
}
