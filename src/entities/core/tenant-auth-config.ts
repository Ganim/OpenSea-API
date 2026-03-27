import { Entity } from '../domain/entities';
import type { Optional } from '../domain/optional';
import type { UniqueEntityID } from '../domain/unique-entity-id';
import type { AuthLinkProvider } from './auth-link';

export interface TenantAuthConfigProps {
  tenantId: UniqueEntityID;
  allowedMethods: AuthLinkProvider[];
  magicLinkEnabled: boolean;
  magicLinkExpiresIn: number;
  defaultMethod: AuthLinkProvider | null;
  createdAt: Date;
  updatedAt: Date;
}

export class TenantAuthConfig extends Entity<TenantAuthConfigProps> {
  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get allowedMethods(): AuthLinkProvider[] {
    return this.props.allowedMethods;
  }

  set allowedMethods(value: AuthLinkProvider[]) {
    this.props.allowedMethods = value;
    this.props.updatedAt = new Date();
  }

  get magicLinkEnabled(): boolean {
    return this.props.magicLinkEnabled;
  }

  set magicLinkEnabled(value: boolean) {
    this.props.magicLinkEnabled = value;
    this.props.updatedAt = new Date();
  }

  get magicLinkExpiresIn(): number {
    return this.props.magicLinkExpiresIn;
  }

  set magicLinkExpiresIn(value: number) {
    this.props.magicLinkExpiresIn = value;
    this.props.updatedAt = new Date();
  }

  get defaultMethod(): AuthLinkProvider | null {
    return this.props.defaultMethod;
  }

  set defaultMethod(value: AuthLinkProvider | null) {
    this.props.defaultMethod = value;
    this.props.updatedAt = new Date();
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Methods
  isMethodAllowed(provider: AuthLinkProvider): boolean {
    return this.props.allowedMethods.includes(provider);
  }

  static create(
    props: Optional<
      TenantAuthConfigProps,
      | 'allowedMethods'
      | 'magicLinkEnabled'
      | 'magicLinkExpiresIn'
      | 'defaultMethod'
      | 'createdAt'
      | 'updatedAt'
    >,
    id?: UniqueEntityID,
  ) {
    return new TenantAuthConfig(
      {
        ...props,
        allowedMethods: props.allowedMethods ?? ['EMAIL'],
        magicLinkEnabled: props.magicLinkEnabled ?? false,
        magicLinkExpiresIn: props.magicLinkExpiresIn ?? 15,
        defaultMethod: props.defaultMethod ?? null,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );
  }
}
