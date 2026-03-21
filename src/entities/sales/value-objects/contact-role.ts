const VALID_ROLES = [
  'DECISION_MAKER',
  'INFLUENCER',
  'CHAMPION',
  'GATEKEEPER',
  'END_USER',
  'OTHER',
] as const;

export type ContactRoleValue = (typeof VALID_ROLES)[number];

export class ContactRole {
  private constructor(private readonly _value: ContactRoleValue) {}

  get value(): ContactRoleValue {
    return this._value;
  }

  static create(value: string): ContactRole {
    if (!VALID_ROLES.includes(value as ContactRoleValue)) {
      throw new Error(
        `Invalid contact role: "${value}". Valid values: ${VALID_ROLES.join(', ')}`,
      );
    }
    return new ContactRole(value as ContactRoleValue);
  }
}
