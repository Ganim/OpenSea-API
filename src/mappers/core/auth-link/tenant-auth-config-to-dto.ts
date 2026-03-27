import type { TenantAuthConfig } from '@/entities/core/tenant-auth-config';
import type { AuthLinkProvider } from '@/entities/core/auth-link';

export interface TenantAuthConfigDTO {
  id: string;
  tenantId: string;
  allowedMethods: AuthLinkProvider[];
  magicLinkEnabled: boolean;
  magicLinkExpiresIn: number;
  defaultMethod: AuthLinkProvider | null;
}

export function tenantAuthConfigToDTO(
  config: TenantAuthConfig,
): TenantAuthConfigDTO {
  return {
    id: config.id.toString(),
    tenantId: config.tenantId.toString(),
    allowedMethods: config.allowedMethods,
    magicLinkEnabled: config.magicLinkEnabled,
    magicLinkExpiresIn: config.magicLinkExpiresIn,
    defaultMethod: config.defaultMethod,
  };
}
