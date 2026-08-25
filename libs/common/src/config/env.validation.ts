import Joi from 'joi';

const rabbitMqSchema = {
  RABBITMQ_HOST: Joi.string().required(),
  RABBITMQ_PORT: Joi.number().port().default(5672),
  RABBITMQ_USER: Joi.string().required(),
  RABBITMQ_PASSWORD: Joi.string().required(),
  RABBITMQ_VHOST: Joi.string().default('/'),
  RABBITMQ_PREFETCH: Joi.number().integer().min(1).max(100).default(16),
};

const postgresSchema = {
  POSTGRES_HOST: Joi.string().required(),
  POSTGRES_PORT: Joi.number().port().default(5432),
  POSTGRES_USER: Joi.string().required(),
  POSTGRES_PASSWORD: Joi.string().required(),
  POSTGRES_POOL_MAX: Joi.number().integer().min(2).max(100).default(20),
  POSTGRES_POOL_MIN: Joi.number().integer().min(0).max(20).default(2),
};

export const gatewayEnvSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  GATEWAY_PORT: Joi.number().port().default(3002),
  GATEWAY_GLOBAL_PREFIX: Joi.string().default('api'),
  SWAGGER_ENABLED: Joi.boolean().default(process.env.NODE_ENV !== 'production'),
  JWT_ACCESS_SECRET: Joi.string().min(16).required(),
  JWT_ACCESS_EXPIRES_IN: Joi.string().default('1d'),
  JWT_REFRESH_SECRET: Joi.string().min(16).required(),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),
  REDIS_HOST: Joi.string().required(),
  REDIS_PORT: Joi.number().port().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').default(''),
  REDIS_DB: Joi.number().integer().min(0).default(0),
  CACHE_TTL_SECONDS: Joi.number().integer().min(1).default(60),
  THROTTLE_TTL_SECONDS: Joi.number().integer().min(1).default(60),
  THROTTLE_LIMIT: Joi.number().integer().min(1).default(60),
  GATEWAY_TIMEOUT_MS: Joi.number().integer().min(1000).default(10_000),
  GATEWAY_MAX_INFLIGHT: Joi.number().integer().min(50).default(2_000),
  GATEWAY_WORKERS: Joi.number().integer().min(0).default(1),
  AUTH_VALIDATE_CACHE_SECONDS: Joi.number().integer().min(1).max(60).default(15),
  CORS_ORIGIN: Joi.string().default('*'),
  ...rabbitMqSchema,
});

export const authEnvSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  AUTH_HTTP_PORT: Joi.number().port().default(3001),
  AUTH_POSTGRES_DATABASE: Joi.string().required(),
  JWT_ACCESS_SECRET: Joi.string().min(16).required(),
  JWT_ACCESS_EXPIRES_IN: Joi.string().default('1d'),
  JWT_REFRESH_SECRET: Joi.string().min(16).required(),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),
  ADMIN_EMAIL: Joi.string().email().optional(),
  ADMIN_PASSWORD: Joi.string().min(8).optional(),
  ...postgresSchema,
  ...rabbitMqSchema,
});

export const userEnvSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  USER_HTTP_PORT: Joi.number().port().default(3003),
  USER_POSTGRES_DATABASE: Joi.string().required(),
  ...postgresSchema,
  ...rabbitMqSchema,
});

export const chatEnvSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  CHAT_HTTP_PORT: Joi.number().port().default(3004),
  CHAT_POSTGRES_DATABASE: Joi.string().required(),
  ...postgresSchema,
  ...rabbitMqSchema,
});
