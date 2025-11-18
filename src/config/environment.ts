/**
 * Environment Configuration
 * Validates and exports environment variables with proper types
 */

interface EnvironmentConfig {
  port: number;
  databaseUrl: string;
  nodeEnv: 'development' | 'production' | 'test';
}

/**
 * Validates and returns environment configuration
 * @throws {Error} If required environment variables are missing
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  const port = parseInt(process.env.PORT || '3000', 10);
  if (isNaN(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be a valid number between 1 and 65535');
  }

  const nodeEnv = (process.env.NODE_ENV || 'development') as 'development' | 'production' | 'test';
  if (!['development', 'production', 'test'].includes(nodeEnv)) {
    throw new Error('NODE_ENV must be one of: development, production, test');
  }

  return {
    port,
    databaseUrl,
    nodeEnv,
  };
}

export const config = getEnvironmentConfig();

