/**
 * Application Entry Point
 * Sets up Express server with middleware and routes
 */

// Load environment variables first, before any other imports
import { config } from 'dotenv';
config();

import express, { Express } from 'express';
import cors from 'cors';
import { config as envConfig } from './config/environment';
import { logger } from './utils/logger';
import { errorHandler, asyncHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { identifyHandler } from './handlers/identify';

/**
 * Creates and configures Express application
 */
function createApp(): Express {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(requestLogger);

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'bitespeed-identity-reconciliation',
    });
  });

  // API Routes
  app.post('/identify', asyncHandler(identifyHandler));

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      error: 'Not Found',
      message: `Cannot ${req.method} ${req.path}`,
    });
  });

  // Error handling middleware (must be last)
  app.use(errorHandler);

  return app;
}

/**
 * Starts the server
 */
function startServer(): void {
  try {
    const app = createApp();

    app.listen(envConfig.port, () => {
      logger.info('Server started successfully', {
        port: envConfig.port,
        environment: envConfig.nodeEnv,
        timestamp: new Date().toISOString(),
      });
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully');
      process.exit(0);
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received, shutting down gracefully');
      process.exit(0);
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
}

// Start the server
startServer();
