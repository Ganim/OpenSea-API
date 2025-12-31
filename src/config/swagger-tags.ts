export const swaggerTags = [
  // Core
  { name: 'Health', description: 'Health check endpoints' },
  { name: 'Core - Requests', description: 'System requests check endpoints' },
  { name: 'Core - Audit', description: 'Audit log management endpoints' },

  // Authentication and User Management
  { name: 'Auth', description: 'Authentication endpoints' },
  { name: 'Auth - Me', description: 'Authenticated user endpoints' },
  { name: 'Auth - Users', description: 'User management endpoints' },
  { name: 'Auth - Sessions', description: 'User session management endpoints' },

  // Stock Management
  { name: 'Stock - Products', description: 'Product catalog management' },
  { name: 'Stock - Variants', description: 'Product variant management' },
  { name: 'Stock - Categories', description: 'Product category management' },
  { name: 'Stock - Manufacturers', description: 'Manufacturer management' },
  { name: 'Stock - Suppliers', description: 'Supplier management' },
  { name: 'Stock - Locations', description: 'Storage location management' },
  { name: 'Stock - Items', description: 'Inventory item management' },
  { name: 'Stock - Item Movements', description: 'Stock movement tracking' },
  { name: 'Stock - Purchase Orders', description: 'Purchase order management' },
  { name: 'Stock - Care', description: 'Care label instructions (ISO 3758)' },

  // Sales Management
  { name: 'Sales - Customers', description: 'Customer management' },
  { name: 'Sales - Orders', description: 'Sales order management' },
  { name: 'Sales - Comments', description: 'Entity comment management' },
  {
    name: 'Sales - Variant Promotions',
    description: 'Product promotion management',
  },
  {
    name: 'Sales - Item Reservations',
    description: 'Inventory reservation management',
  },
  {
    name: 'Sales - Notification Preferences',
    description: 'User notification settings',
  },
  // Workflow Notifications
  {
    name: 'Sales - Notifications',
    description: 'User notifications management',
  },

  // HR Management
  { name: 'HR - Employees', description: 'Employee management' },
  { name: 'HR - Departments', description: 'Department management' },
  { name: 'HR - Positions', description: 'Position management' },
  { name: 'HR - Time Control', description: 'Time tracking and clock in/out' },
  { name: 'HR - Work Schedules', description: 'Work schedule management' },
  { name: 'HR - Overtime', description: 'Overtime request and approval' },
  { name: 'HR - Time Bank', description: 'Time bank management' },
];
