export type ContactRoleValue =
  | 'DECISION_MAKER'
  | 'INFLUENCER'
  | 'CHAMPION'
  | 'GATEKEEPER'
  | 'END_USER'
  | 'OTHER';

export class ContactRole {
  private static readonly VALID_VALUES: ContactRoleValue[] = [
    'DECISION_MAKER',
    'INFLUENCER',
    'CHAMPION',
    'GATEKEEPER',
    'END_USER',
    'OTHER',
  ];

  private readonly _value: ContactRoleValue;

  private constructor(value: ContactRoleValue) {
    this._value = value;
  }

  static create(value: string): ContactRole {
    const normalized = value.toUpperCase();

    if (!ContactRole.VALID_VALUES.includes(normalized as ContactRoleValue)) {
      throw new Error(
        `Invalid ContactRole: "${value}". Valid values: ${ContactRole.VALID_VALUES.join(', ')}`,
      );
    }

    return new ContactRole(normalized as ContactRoleValue);
  }

  get value(): ContactRoleValue {
    return this._value;
  }

  get isDecisionMaker(): boolean {
    return this._value === 'DECISION_MAKER';
  }

  get isInfluencer(): boolean {
    return this._value === 'INFLUENCER';
  }

  get isChampion(): boolean {
    return this._value === 'CHAMPION';
  }

  get isGatekeeper(): boolean {
    return this._value === 'GATEKEEPER';
  }

  get isEndUser(): boolean {
    return this._value === 'END_USER';
  }

  get isOther(): boolean {
    return this._value === 'OTHER';
  }

  toString(): string {
    return this._value;
  }

  equals(other: ContactRole): boolean {
    return this._value === other._value;
  }
}
