# Tipos TypeScript para a API

Este arquivo contém todas as definições de tipos TypeScript para facilitar o desenvolvimento do front-end.

## Tipos Core (Autenticação e Usuários)

```typescript
// types/core.ts

export type UserRole = 'USER' | 'MANAGER' | 'ADMIN';

export interface UserProfile {
  id: string;
  userId: string;
  name: string;
  surname: string;
  birthday?: Date;
  location: string;
  bio: string;
  avatarUrl: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  lastLoginAt: Date | null;
  deletedAt?: Date | null;
  profile?: UserProfile | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  username?: string;
  profile?: Partial<Omit<UserProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>;
}

export interface AuthResponse {
  user: User;
  sessionId: string;
  token: string;
  refreshToken: string;
}

export interface Session {
  id: string;
  userId: string;
  isActive: boolean;
  createdAt: Date;
  expiresAt: Date;
  lastActivityAt: Date;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordReset {
  token: string;
  newPassword: string;
}

export interface UpdateProfile {
  name?: string;
  surname?: string;
  birthday?: Date;
  location?: string;
  bio?: string;
  avatarUrl?: string;
}

export interface UpdatePassword {
  oldPassword: string;
  newPassword: string;
}

export interface CreateUser {
  username: string;
  email: string;
  password: string;
  role?: UserRole;
}
```

## Tipos Stock (Estoque)

```typescript
// types/stock.ts

export type ProductStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
export type UnitOfMeasure = 'METERS' | 'KILOGRAMS' | 'UNITS';
export type ItemStatus = 'AVAILABLE' | 'RESERVED' | 'SOLD' | 'DAMAGED';
export type MovementType = 'ENTRY' | 'EXIT' | 'TRANSFER' | 'ADJUSTMENT';
export type PurchaseOrderStatus = 'PENDING' | 'CONFIRMED' | 'RECEIVED' | 'CANCELLED';
export type LocationType = 'WAREHOUSE' | 'ZONE' | 'AISLE' | 'SHELF' | 'BIN' | 'OTHER';

export interface Product {
  id: string;
  name: string;
  code: string;
  description?: string;
  status: ProductStatus;
  unitOfMeasure: UnitOfMeasure;
  attributes: Record<string, any>;
  templateId: string;
  supplierId?: string;
  manufacturerId?: string;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export interface CreateProduct {
  name: string;
  code: string;
  description?: string;
  status?: ProductStatus;
  unitOfMeasure: UnitOfMeasure;
  attributes?: Record<string, any>;
  templateId: string;
  supplierId?: string;
  manufacturerId?: string;
}

export interface Variant {
  id: string;
  productId: string;
  sku: string;
  name: string;
  price: number;
  imageUrl?: string;
  attributes: Record<string, unknown>;
  costPrice?: number;
  profitMargin?: number;
  barcode?: string;
  qrCode?: string;
  eanCode?: string;
  upcCode?: string;
  minStock?: number;
  maxStock?: number;
  reorderPoint?: number;
  reorderQuantity?: number;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export interface CreateVariant {
  productId: string;
  sku: string;
  name: string;
  price: number;
  imageUrl?: string;
  attributes?: Record<string, unknown>;
  costPrice?: number;
  profitMargin?: number;
  barcode?: string;
  qrCode?: string;
  eanCode?: string;
  upcCode?: string;
  minStock?: number;
  maxStock?: number;
  reorderPoint?: number;
  reorderQuantity?: number;
}

export interface Item {
  id: string;
  variantId: string;
  locationId: string;
  uniqueCode: string;
  initialQuantity: number;
  currentQuantity: number;
  status: ItemStatus;
  entryDate: Date;
  attributes: Record<string, unknown>;
  batchNumber?: string;
  manufacturingDate?: Date;
  expiryDate?: Date;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export interface RegisterItemEntry {
  uniqueCode: string;
  variantId: string;
  locationId: string;
  quantity: number;
  attributes?: Record<string, unknown>;
  batchNumber?: string;
  manufacturingDate?: Date;
  expiryDate?: Date;
  notes?: string;
}

export interface RegisterItemExit {
  itemId: string;
  quantity: number;
  movementType: 'SALE' | 'PRODUCTION' | 'SAMPLE' | 'LOSS';
  reasonCode?: string;
  destinationRef?: string;
  notes?: string;
}

export interface TransferItem {
  itemId: string;
  destinationLocationId: string;
  reasonCode?: string;
  notes?: string;
}

export interface ItemMovement {
  id: string;
  itemId: string;
  userId: string;
  quantity: number;
  quantityBefore?: number | null;
  quantityAfter?: number | null;
  movementType: MovementType;
  reasonCode?: string | null;
  destinationRef?: string | null;
  batchNumber?: string | null;
  notes?: string | null;
  approvedBy?: string | null;
  salesOrderId?: string | null;
  createdAt: Date;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  parentId?: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export interface CreateCategory {
  name: string;
  slug?: string;
  description?: string;
  parentId?: string;
  displayOrder?: number;
  isActive?: boolean;
}

export interface Manufacturer {
  id: string;
  name: string;
  country: string;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  isActive: boolean;
  rating?: number | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface CreateManufacturer {
  name: string;
  country: string;
  email?: string;
  phone?: string;
  website?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  isActive?: boolean;
  rating?: number;
  notes?: string;
}

export interface Supplier {
  id: string;
  name: string;
  cnpj?: string;
  taxId?: string;
  contact?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  paymentTerms?: string;
  rating?: number;
  isActive: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export interface CreateSupplier {
  name: string;
  cnpj?: string;
  taxId?: string;
  contact?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  paymentTerms?: string;
  rating?: number;
  isActive?: boolean;
  notes?: string;
}

export interface Location {
  id: string;
  code: string;
  description?: string;
  locationType?: LocationType;
  parentId?: string;
  capacity?: number;
  currentOccupancy?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export interface CreateLocation {
  code: string;
  description?: string;
  locationType?: LocationType;
  parentId?: string;
  capacity?: number;
  currentOccupancy?: number;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  color?: string | null;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface CreateTag {
  name: string;
  color?: string;
  description?: string;
}

export interface Template {
  id: string;
  name: string;
  productAttributes: Record<string, unknown>;
  variantAttributes: Record<string, unknown>;
  itemAttributes: Record<string, unknown>;
  createdAt: Date;
  updatedAt?: Date | null;
  deletedAt?: Date | null;
}

export interface CreateTemplate {
  name: string;
  productAttributes?: Record<string, unknown>;
  variantAttributes?: Record<string, unknown>;
  itemAttributes?: Record<string, unknown>;
}

export interface PurchaseOrderItem {
  id: string;
  orderId: string;
  variantId: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  notes?: string | null;
  createdAt: Date;
  updatedAt?: Date | null;
}

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  status: PurchaseOrderStatus;
  supplierId: string;
  createdBy?: string | null;
  totalCost: number;
  expectedDate?: Date | null;
  receivedDate?: Date | null;
  notes?: string | null;
  items: PurchaseOrderItem[];
  createdAt: Date;
  updatedAt?: Date | null;
  deletedAt?: Date | null;
}

export interface CreatePurchaseOrder {
  orderNumber: string;
  supplierId: string;
  expectedDate?: Date;
  status?: PurchaseOrderStatus;
  notes?: string;
  items: Array<{
    variantId: string;
    quantity: number;
    unitCost: number;
  }>;
}
```

## Tipos Sales (Vendas)

```typescript
// types/sales.ts

export type CustomerType = 'INDIVIDUAL' | 'BUSINESS';
export type SalesOrderStatus = 
  | 'DRAFT' 
  | 'PENDING' 
  | 'CONFIRMED' 
  | 'IN_TRANSIT' 
  | 'DELIVERED' 
  | 'CANCELLED' 
  | 'RETURNED';
export type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT';
export type AlertType = 
  | 'LOW_STOCK' 
  | 'OUT_OF_STOCK' 
  | 'EXPIRING_SOON' 
  | 'EXPIRED' 
  | 'PRICE_CHANGE' 
  | 'REORDER_POINT';
export type NotificationChannel = 'IN_APP' | 'EMAIL' | 'SMS' | 'PUSH';

export interface Customer {
  id: string;
  name: string;
  type: CustomerType;
  document?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export interface CreateCustomer {
  name: string;
  type: CustomerType;
  document?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  notes?: string;
}

export interface SalesOrderItem {
  id: string;
  variantId: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  totalPrice: number;
  notes?: string | null;
}

export interface SalesOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  createdBy?: string | null;
  status: SalesOrderStatus;
  totalPrice: number;
  discount: number;
  finalPrice: number;
  notes?: string | null;
  items: SalesOrderItem[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface CreateSalesOrder {
  customerId: string;
  orderNumber: string;
  status?: 'DRAFT' | 'PENDING' | 'CONFIRMED';
  discount?: number;
  notes?: string;
  items: Array<{
    variantId: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
    notes?: string;
  }>;
  createdBy?: string;
}

export interface Comment {
  id: string;
  entityType: string;
  entityId: string;
  userId: string;
  content: string;
  parentCommentId?: string;
  isDeleted: boolean;
  isEdited: boolean;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export interface CreateComment {
  entityType: string;
  entityId: string;
  content: string;
  parentCommentId?: string;
}

export interface VariantPromotion {
  id: string;
  variantId: string;
  name: string;
  discountType: DiscountType;
  discountValue: number;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  isCurrentlyValid: boolean;
  isExpired: boolean;
  isUpcoming: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface CreateVariantPromotion {
  variantId: string;
  name: string;
  discountType: DiscountType;
  discountValue: number;
  startDate: Date;
  endDate: Date;
  isActive?: boolean;
  notes?: string;
}

export interface ItemReservation {
  id: string;
  itemId: string;
  userId: string;
  quantity: number;
  reason?: string;
  reference?: string;
  expiresAt: Date;
  releasedAt?: Date;
  isExpired: boolean;
  isReleased: boolean;
  isActive: boolean;
  createdAt: Date;
}

export interface CreateItemReservation {
  itemId: string;
  userId: string;
  quantity: number;
  reason?: string;
  reference?: string;
  expiresAt: Date;
}

export interface NotificationPreference {
  id: string;
  userId: string;
  alertType: AlertType;
  channel: NotificationChannel;
  isEnabled: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export interface CreateNotificationPreference {
  userId: string;
  alertType: AlertType;
  channel: NotificationChannel;
  isEnabled?: boolean;
}
```

## Tipos Comuns

```typescript
// types/common.ts

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ApiError {
  message: string;
  statusCode?: number;
}

export interface HealthCheck {
  status: 'ok' | 'error';
  timestamp: Date;
  uptime?: number;
  environment?: string;
  message?: string;
}

export type UpdateData<T> = Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>>;
```

## Uso dos Tipos

```typescript
// Exemplo de uso em um serviço
import { Product, CreateProduct, UpdateData } from './types/stock';
import { apiRequest } from './api/client';

export class ProductsService {
  static async list(): Promise<Product[]> {
    const response = await apiRequest<{ products: Product[] }>('/v1/products');
    return response.products;
  }

  static async create(data: CreateProduct): Promise<Product> {
    const response = await apiRequest<{ product: Product }>('/v1/products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.product;
  }

  static async update(id: string, data: UpdateData<Product>): Promise<Product> {
    const response = await apiRequest<{ product: Product }>(`/v1/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return response.product;
  }
}
```

Esses tipos podem ser copiados diretamente para o projeto front-end e ajudarão a garantir type-safety em toda a aplicação.
