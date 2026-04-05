import { Entity } from '../domain/entities';
import type { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export type PrinterType = 'THERMAL' | 'INKJET' | 'LABEL';
export type PrinterConnection = 'USB' | 'NETWORK' | 'BLUETOOTH' | 'SERIAL';

export interface PosPrinterProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  name: string;
  type: PrinterType;
  connection: PrinterConnection;
  ipAddress?: string;
  port?: number;
  deviceId?: string;
  bluetoothAddress?: string;
  paperWidth: 80 | 58;
  encoding: string;
  characterPerLine: number;
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export class PosPrinter extends Entity<PosPrinterProps> {
  get tenantId() {
    return this.props.tenantId;
  }

  get name() {
    return this.props.name;
  }

  set name(value: string) {
    this.props.name = value;
    this.touch();
  }

  get type() {
    return this.props.type;
  }

  get connection() {
    return this.props.connection;
  }

  get ipAddress() {
    return this.props.ipAddress;
  }

  get port() {
    return this.props.port;
  }

  get deviceId() {
    return this.props.deviceId;
  }

  get bluetoothAddress() {
    return this.props.bluetoothAddress;
  }

  get paperWidth() {
    return this.props.paperWidth;
  }

  get encoding() {
    return this.props.encoding;
  }

  get characterPerLine() {
    return this.props.characterPerLine;
  }

  get isDefault() {
    return this.props.isDefault;
  }

  set isDefault(value: boolean) {
    this.props.isDefault = value;
    this.touch();
  }

  get isActive() {
    return this.props.isActive;
  }

  set isActive(value: boolean) {
    this.props.isActive = value;
    this.touch();
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get updatedAt() {
    return this.props.updatedAt;
  }

  get deletedAt() {
    return this.props.deletedAt;
  }

  set deletedAt(value: Date | undefined) {
    this.props.deletedAt = value;
    this.touch();
  }

  private touch() {
    this.props.updatedAt = new Date();
  }

  static create(
    props: Optional<
      PosPrinterProps,
      | 'id'
      | 'createdAt'
      | 'isActive'
      | 'isDefault'
      | 'paperWidth'
      | 'encoding'
      | 'characterPerLine'
      | 'port'
    >,
    id?: UniqueEntityID,
  ) {
    const paperWidth = props.paperWidth ?? 80;

    return new PosPrinter(
      {
        ...props,
        id: props.id ?? new UniqueEntityID(),
        port: props.port ?? 9100,
        paperWidth,
        encoding: props.encoding ?? 'UTF-8',
        characterPerLine:
          props.characterPerLine ?? (paperWidth === 58 ? 32 : 42),
        isDefault: props.isDefault ?? false,
        isActive: props.isActive ?? true,
        createdAt: props.createdAt ?? new Date(),
      },
      id ?? props.id,
    );
  }
}
