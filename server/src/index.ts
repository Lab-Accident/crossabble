import { setupApp } from './app';
import { connectDB, disconnectDB } from './database';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createSocketService } from './services/socketService';
import logger from './utils/logger';
import { config } from './config';

/**
 * Application entry point
 */
const startServer = async () => {
  try {
    logger.info({ 
      environment: config.environment,
      port: config.port,
      mongoUri: config.mongoUri.replace(/\/\/(.+?):.+?@/, '//***:***@') // Mask credentials in logs
    }, 'Starting server');

    // Connect to database
    const connection = await connectDB();
    logger.info('Database connection established');

    // Create HTTP server
    const httpServer = createServer();
    logger.debug('HTTP server created');

    // Initialize Socket.IO
    const io = new Server(httpServer, {
      cors: {
        origin: config.clientUrl,
        methods: ['GET', 'POST']
      }
    });
    logger.debug({ corsOrigin: config.clientUrl }, 'Socket.IO initialized');

    // Setup Express app
    const app = setupApp(io);
    httpServer.on('request', app);
    logger.debug('Express app mounted');

    // Setup socket handlers
    const socketService = createSocketService(io);
    logger.debug('Socket service initialized');

    // Set up shutdown handlers
    setupGracefulShutdown(httpServer);

    // Start listening
    httpServer.listen(config.port, () => {
      logger.info({ port: config.port }, 'Server running');
    });
  } catch (error) {
    logger.error(error as Error, 'Failed to start server');
    process.exit(1);
  }
};

/**
 * Sets up graceful shutdown handlers
 */
const setupGracefulShutdown = (server: any) => {
  logger.debug('Setting up graceful shutdown handlers');

  // Handle process termination
  const shutdown = async () => {
    logger.info('Shutting down server...');
    
    // Close HTTP server
    server.close(() => {
      logger.info('HTTP server closed');
    });
    
    try {
      await disconnectDB();
      logger.info('Clean shutdown complete');
      process.exit(0);
    } catch (error) {
      logger.error(error as Error, 'Error during shutdown');
      process.exit(1);
    }
  };
  
  // Register shutdown handlers
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received');
    shutdown();
  });
  
  process.on('SIGINT', () => {
    logger.info('SIGINT received');
    shutdown();
  });
  
  // Handle unhandled errors
  process.on('uncaughtException', (error) => {
    logger.error(error, 'Uncaught exception');
    shutdown();
  });
  
  process.on('unhandledRejection', (reason) => {
    logger.error({ reason }, 'Unhandled rejection');
    shutdown();
  });
};

// Start the server
startServer();