/**
 * Stock Module Zod Schemas - Compatibility Layer
 * @deprecated Use imports from @/http/schemas/stock/* instead
 * This file re-exports all Stock schemas for backward compatibility
 *
 * Note: Manufacturer and Supplier schemas are NOT exported here to avoid
 * naming conflicts with HR module schemas. Import them directly from:
 * - @/http/schemas/stock/manufacturers
 * - @/http/schemas/stock/suppliers
 */

export * from './stock/address';
export * from './stock/bins';
export * from './stock/categories';
export * from './stock/common';
export * from './stock/items';
export * from './stock/labels';
export * from './stock/products';
export * from './stock/variants';
export * from './stock/warehouses';
export * from './stock/zones';
// Manufacturers and Suppliers are NOT exported to avoid conflicts with HR schemas
// Import directly from './stock/manufacturers' or './stock/suppliers' if needed
export * from './stock/care';
export * from './stock/purchase-orders';
export * from './stock/tags';
export * from './stock/templates';
