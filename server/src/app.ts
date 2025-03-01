import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { Session } from './models/sessionModel';
import { Server } from 'socket.io';
import { createGameRouter } from './routes/gameRoutes';
import { registry } from './services/registry';
import logger from './utils/logger'; 
import { config } from './config';

export function setupApp(io: Server) {
  const app = express();

  registry.initialize(io);
  
  app.use(cors());
  app.use(express.json());

  app.use((req, res, next) => {
    logger.debug({ 
      method: req.method, 
      url: req.url, 
      ip: req.ip 
    }, 'Request received');
    next();
  });
  

  app.get('/api/test', (req, res) => {
    logger.info('Test endpoint called');
    res.json({ message: 'Server is running' });
  });

  app.get('/api/health', (req, res) => {
    const health = {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      mongoStatus: mongoose.connection?.readyState || 'disconnected'
    };
    
    logger.info(health, 'Health check');
    res.json(health);
  });

  app.use('/api/games', createGameRouter(registry.gameService!));

  if (config.environment === 'development') {
    app.get('/api/sessions', async (req, res) => {
      logger.debug('Fetching all sessions');
      const sessions = await Session.find();
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify(sessions, null, 2));
    });
  }

  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error({ 
      err: { 
        message: err.message, 
        stack: err.stack 
      }, 
      req: { 
        method: req.method, 
        url: req.url 
      }
    }, 'Unhandled error');
    
    res.status(500).json({
      error: config.environment === 'development' ? err.message : 'Internal server error'
    });
  });

  logger.info('Express app configured');

  return app;
}

export const app = express();