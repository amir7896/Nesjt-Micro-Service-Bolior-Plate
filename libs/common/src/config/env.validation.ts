import Joi from 'joi';

const rabbitMqSchema = {
  RABBITMQ_HOST: Joi.string().required(),
  RABBITMQ_PORT: Joi.number().port().default(5672),
  RABBITMQ_USER: Joi.string().required(),
  RABBITMQ_PASSWORD: Joi.string().required(),
  RABBITMQ_VHOST: Joi.string().default('/'),
};

const postgresSchema = {
  POSTGRES_HOST: Joi.string().required(),
  POSTGRES_PORT: Joi.number().port().default(5432),
  POSTGRES_USER: Joi.string().required(),
  POSTGRES_PASSWORD: Joi.string().required(),
};

export const gatewayEnvSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  GATEWAY_PORT: Joi.number().port().default(3000),
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
  USER_HTTP_PORT: Joi.number().port().default(3002),
  USER_POSTGRES_DATABASE: Joi.string().required(),
  ...postgresSchema,
  ...rabbitMqSchema,
});
