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
import { rateLimitConfig } from './config/rate-limits';
import { swaggerTags } from './config/swagger-tags';
import { registerRoutes } from './http/routes';
import { auditContextHook } from './http/hooks/audit-context.hook';
import auditLoggerPlugin from './http/plugins/audit-logger.plugin';

export const app = fastify({ trustProxy: true });

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

// Captura contexto (user/ip/ua/endpoint) para o audit log
app.addHook('onRequest', auditContextHook);

// Custom JSON parser that allows empty bodies
app.addContentTypeParser('application/json', function (request, payload, done) {
  let body = '';
  payload.on('data', (chunk) => {
    body += chunk;
  });
  payload.on('end', () => {
    if (body === '') {
      done(null, {});
    } else {
      try {
        const parsed = JSON.parse(body);
        done(null, parsed);
      } catch (err) {
        done(err instanceof Error ? err : new Error(String(err)), undefined);
      }
    }
  });
});

// Error handler
app.setErrorHandler(errorHandler);

// Rate limiting global (disabled in tests to avoid flakiness)
const isTestEnv =
  env.NODE_ENV === 'test' ||
  process.env.VITEST === 'true' ||
  process.env.VITEST === '1';
if (!isTestEnv) {
  app.register(rateLimit, rateLimitConfig.global);
}

// CORS - Cross-Origin Resource Sharing
app.register(cors, {
  origin: env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
});

// Swagger
app.register(swagger, {
  mode: 'dynamic',
  openapi: {
    info: {
      title: 'OpenSea API',
      description:
        'API completa para gestão de estoque e vendas com Clean Architecture',
      version: '3.5.0',
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
    tags: swaggerTags,
  },
});

// Authentication
app.register(fastifyJwt, {
  secret: env.JWT_SECRET,
  sign: {
    algorithm: 'HS256',
    expiresIn: '30m', // 30 minutos - melhor UX mantendo segurança
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

// Audit logger - registra operações mutáveis
app.register(auditLoggerPlugin);

// Routes
app.after(() => {
  app.register(registerRoutes);
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
