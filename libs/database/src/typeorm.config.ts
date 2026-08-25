import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export interface PostgresConnectionInput {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  entities: TypeOrmModuleOptions['entities'];
  migrations?: TypeOrmModuleOptions['migrations'];
  poolMax?: number;
  poolMin?: number;
}

export function createTypeOrmOptions(
  input: PostgresConnectionInput,
): TypeOrmModuleOptions {
  const isProduction = process.env.NODE_ENV === 'production';
  const poolMax = input.poolMax ?? Number(process.env.POSTGRES_POOL_MAX ?? 20);
  const poolMin = input.poolMin ?? Number(process.env.POSTGRES_POOL_MIN ?? 2);

  return {
    type: 'postgres',
    host: input.host,
    port: input.port,
    username: input.username,
    password: input.password,
    database: input.database,
    entities: input.entities,
    migrations: input.migrations,
    synchronize: false,
    migrationsRun: false,
    uuidExtension: 'pgcrypto',
    logging: isProduction ? ['error'] : ['error', 'warn'],
    extra: {
      max: poolMax,
      min: poolMin,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
      statement_timeout: 10_000,
    },
    retryAttempts: 10,
    retryDelay: 3000,
  };
}
