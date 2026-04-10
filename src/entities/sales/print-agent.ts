import { Entity } from '../domain/entities';
import type { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export type AgentStatus = 'ONLINE' | 'OFFLINE' | 'ERROR';

export interface PrintAgentProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  name: string;
  apiKeyHash: string;
  apiKeyPrefix: string;
  status: AgentStatus;
  lastSeenAt?: Date;
  ipAddress?: string;
  hostname?: string;
  osInfo?: Record<string, unknown>;
  version?: string;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export class PrintAgent extends Entity<PrintAgentProps> {
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

  get apiKeyHash() {
    return this.props.apiKeyHash;
  }

  set apiKeyHash(value: string) {
    this.props.apiKeyHash = value;
    this.touch();
  }

  get apiKeyPrefix() {
    return this.props.apiKeyPrefix;
  }

  set apiKeyPrefix(value: string) {
    this.props.apiKeyPrefix = value;
    this.touch();
  }

  get status() {
    return this.props.status;
  }

  set status(value: AgentStatus) {
    this.props.status = value;
    this.touch();
  }

  get lastSeenAt() {
    return this.props.lastSeenAt;
  }

  get ipAddress() {
    return this.props.ipAddress;
  }

  get hostname() {
    return this.props.hostname;
  }

  get osInfo() {
    return this.props.osInfo;
  }

  set osInfo(value: Record<string, unknown> | undefined) {
    this.props.osInfo = value;
    this.touch();
  }

  get version() {
    return this.props.version;
  }

  set version(value: string | undefined) {
    this.props.version = value;
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

  recordHeartbeat(ipAddress?: string, hostname?: string) {
    this.props.lastSeenAt = new Date();
    this.props.ipAddress = ipAddress ?? this.props.ipAddress;
    this.props.hostname = hostname ?? this.props.hostname;
    this.props.status = 'ONLINE';
    this.touch();
  }

  markOffline() {
    this.props.status = 'OFFLINE';
    this.touch();
  }

  private touch() {
    this.props.updatedAt = new Date();
  }

  static create(
    props: Optional<PrintAgentProps, 'id' | 'createdAt' | 'status'>,
    id?: UniqueEntityID,
  ) {
    return new PrintAgent(
      {
        ...props,
        id: props.id ?? new UniqueEntityID(),
        status: props.status ?? 'OFFLINE',
        createdAt: props.createdAt ?? new Date(),
      },
      id ?? props.id,
    );
  }
}
