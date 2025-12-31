// Base Organization
export {
  Organization,
  OrganizationType,
  OrganizationStatus,
  TaxRegime,
  type OrganizationProps,
} from './organization';

// Company
export {
  Company,
  type CompanyProps,
  type CompanySpecificData,
} from './company';

// Supplier
export {
  Supplier,
  type SupplierProps,
  type SupplierSpecificData,
} from './supplier';

// Manufacturer
export {
  Manufacturer,
  type ManufacturerProps,
  type ManufacturerSpecificData,
} from './manufacturer';

// Type guards
import type { Organization } from './organization';
import type { Company } from './company';
import type { Supplier } from './supplier';
import type { Manufacturer } from './manufacturer';

export function isCompany(org: Organization): org is Company {
  return org.isCompany();
}

export function isSupplier(org: Organization): org is Supplier {
  return org.isSupplier();
}

export function isManufacturer(org: Organization): org is Manufacturer {
  return org.isManufacturer();
}
