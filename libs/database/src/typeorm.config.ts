import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export interface PostgresConnectionInput {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  entities: TypeOrmModuleOptions['entities'];
  migrations?: TypeOrmModuleOptions['migrations'];
}

export function createTypeOrmOptions(
  input: PostgresConnectionInput,
): TypeOrmModuleOptions {
  const isProduction = process.env.NODE_ENV === 'production';

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
      max: 10,
    },
    retryAttempts: 10,
    retryDelay: 3000,
  };
}
