import fastifyCookie from '@fastify/cookie';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import fastifyJwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
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
import { jwtConfig, getJwtSecret, isUsingRS256 } from './config/jwt';
import { registerRoutes } from './http/routes';
import requestIdPlugin from './http/plugins/request-id.plugin';
import { initSentry } from './lib/sentry';

// Initialize Sentry for error monitoring
// TEMP: Disabled to debug production startup issue
// initSentry();

export const app = fastify({ trustProxy: true });

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

// Custom JSON parser that allows empty bodies
app.addContentTypeParser('application/json', function (request, payload, done) {
  let body = '';

  payload.on('error', (err) => {
    done(err instanceof Error ? err : new Error(String(err)), undefined);
  });

  payload.on('data', (chunk) => {
    body += chunk;
  });

  payload.on('end', () => {
    if (body === '' || body.trim() === '') {
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

// Request ID correlation - must be registered early
app.register(requestIdPlugin);

// Security headers with Helmet
// IMPORTANTE: Deve ser registrado ANTES do CORS
app.register(helmet, {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // Para Swagger UI
      scriptSrc: ["'self'", "'unsafe-inline'"], // Para Swagger UI
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  crossOriginEmbedderPolicy: false, // Para Swagger UI funcionar
  crossOriginResourcePolicy: { policy: 'cross-origin' },
});

// CORS - Cross-Origin Resource Sharing
// IMPORTANTE: Deve ser registrado ANTES do rate limit para que
// respostas de rate limit também incluam headers CORS
app.register(cors, {
  origin: (origin, cb) => {
    // Lista de origens permitidas
    const allowedOrigins = [
      env.FRONTEND_URL,
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ];

    // Permite requests sem origin (ex: Postman, curl, mobile apps)
    if (!origin) {
      cb(null, true);
      return;
    }

    // Verifica se a origem está na lista permitida
    if (allowedOrigins.includes(origin)) {
      cb(null, true);
      return;
    }

    // Bloqueia origens não permitidas
    cb(new Error('Not allowed by CORS'), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Length', 'X-Request-Id'],
});

// Rate limiting global (disabled in tests to avoid flakiness)
const isTestEnv =
  env.NODE_ENV === 'test' ||
  process.env.VITEST === 'true' ||
  process.env.VITEST === '1';
if (!isTestEnv) {
  app.register(rateLimit, rateLimitConfig.global);
}

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

// Authentication with RS256 support
const jwtSecret = getJwtSecret();
const usingRS256 = isUsingRS256();

app.register(fastifyJwt, {
  secret: jwtSecret,
  sign: {
    algorithm: jwtConfig.algorithm,
    expiresIn: jwtConfig.accessTokenExpiresIn,
    iss: jwtConfig.issuer,
    aud: jwtConfig.audience,
    ...(usingRS256 && { key: (jwtSecret as { private: string }).private }),
  },
  verify: {
    algorithms: [jwtConfig.algorithm],
    allowedIss: jwtConfig.issuer,
    allowedAud: jwtConfig.audience,
    ...(usingRS256 && { key: (jwtSecret as { public: string }).public }),
  },
  cookie: {
    cookieName: 'refreshToken',
    signed: false,
  },
});

app.register(fastifyCookie);

// Multipart (file uploads)
app.register(multipart, {
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

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
