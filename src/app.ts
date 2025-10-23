import fastifyCookie from '@fastify/cookie';
import cors from '@fastify/cors';
import fastifyJwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import fastify from 'fastify';
import {
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod';
import { SwaggerTheme, SwaggerThemeNameEnum } from 'swagger-themes';
import { env } from './@env';
import { errorHandler } from './@errors/error-handler';
import { authRoutes } from './http/controllers/core/auth/routes';
import { meRoutes } from './http/controllers/core/me/routes';
import { sessionsRoutes } from './http/controllers/core/sessions/routes';
import { usersRoutes } from './http/controllers/core/users/routes';
import { healthRoutes } from './http/controllers/health/routes';
import { commentsRoutes } from './http/controllers/sales/comments/routes';
import { customersRoutes } from './http/controllers/sales/customers/routes';
import { salesOrdersRoutes } from './http/controllers/sales/sales-orders/routes';
import { variantPromotionsRoutes } from './http/controllers/sales/variant-promotions/routes';
import { categoriesRoutes } from './http/controllers/stock/categories/routes';
import { itemMovementsRoutes } from './http/controllers/stock/item-movements/routes';
import { itemsRoutes } from './http/controllers/stock/items/routes';
import { locationsRoutes } from './http/controllers/stock/locations/routes';
import { manufacturersRoutes } from './http/controllers/stock/manufacturers/routes';
import { productsRoutes } from './http/controllers/stock/products/routes';
import { purchaseOrdersRoutes } from './http/controllers/stock/purchase-orders/routes';
import { suppliersRoutes } from './http/controllers/stock/suppliers/routes';
import { tagsRoutes } from './http/controllers/stock/tags/routes';
import { templatesRoutes } from './http/controllers/stock/templates/routes';
import { variantsRoutes } from './http/controllers/stock/variants/routes';

export const app = fastify({ trustProxy: true });

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

// Error handler
app.setErrorHandler(errorHandler);

// Rate limit
app.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
});

// CORS - Cross-Origin Resource Sharing
app.register(cors, {
  origin: env.FRONTEND_URL,
  credentials: true,
});

// Swagger
app.register(swagger, {
  mode: 'dynamic',
  openapi: {
    info: {
      title: 'Simple Auth',
      description: 'A Simple Authentication API Boilerplate to build projects',
      version: '3.0.0',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    tags: [
      { name: 'Health', description: 'Health check endpoints' },
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: 'Me', description: 'Authenticated user endpoints' },
      { name: 'Users', description: 'User management endpoints' },
      { name: 'Sessions', description: 'Session management endpoints' },
      // Stock Management
      { name: 'Products', description: 'Product catalog management' },
      { name: 'Variants', description: 'Product variant management' },
      { name: 'Categories', description: 'Product category management' },
      { name: 'Manufacturers', description: 'Manufacturer management' },
      { name: 'Suppliers', description: 'Supplier management' },
      { name: 'Locations', description: 'Storage location management' },
      { name: 'Tags', description: 'Product tag management' },
      { name: 'Templates', description: 'Product template management' },
      { name: 'Items', description: 'Inventory item management' },
      { name: 'Item Movements', description: 'Stock movement tracking' },
      { name: 'Purchase Orders', description: 'Purchase order management' },
      // Sales Management
      { name: 'Customers', description: 'Customer management' },
      { name: 'Sales Orders', description: 'Sales order management' },
      { name: 'Comments', description: 'Entity comment management' },
      {
        name: 'Variant Promotions',
        description: 'Product promotion management',
      },
      {
        name: 'Item Reservations',
        description: 'Inventory reservation management',
      },
      {
        name: 'Notification Preferences',
        description: 'User notification settings',
      },
    ],
  },
});

// Authentication
app.register(fastifyJwt, {
  secret: env.JWT_SECRET,
  sign: {
    algorithm: 'HS256',
    expiresIn: '10m',
  },
  verify: {
    algorithms: ['HS256'],
  },
  cookie: {
    cookieName: 'refreshToken',
    signed: false,
  },
});

app.register(fastifyCookie);

// Routes
app.after(() => {
  // Core routes
  app.register(healthRoutes);
  app.register(meRoutes);
  app.register(authRoutes);
  app.register(usersRoutes);
  app.register(sessionsRoutes);
  // Stock routes
  app.register(productsRoutes);
  app.register(variantsRoutes);
  app.register(categoriesRoutes);
  app.register(manufacturersRoutes);
  app.register(suppliersRoutes);
  app.register(locationsRoutes);
  app.register(tagsRoutes);
  app.register(templatesRoutes);
  app.register(itemsRoutes);
  app.register(itemMovementsRoutes);
  app.register(purchaseOrdersRoutes);
  // Sales routes
  app.register(customersRoutes);
  app.register(salesOrdersRoutes);
  app.register(commentsRoutes);
  app.register(variantPromotionsRoutes);
});

// Swagger UI
const swaggerTheme = new SwaggerTheme();
const theme = swaggerTheme.getBuffer(SwaggerThemeNameEnum.FLATTOP);

app.register(swaggerUI, {
  routePrefix: '/docs',
  staticCSP: true,
  uiConfig: {
    docExpansion: 'list',
    deepLinking: false,
    displayRequestDuration: true,
    operationsSorter: 'method',
  },
  theme: {
    css: [{ filename: 'theme.css', content: theme }],
  },
});
