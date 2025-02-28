import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { GameService } from './services/gameService';
import { Session } from './models/gameSessionModel';
import { Server } from 'socket.io';
import { createGameRouter } from './routes/gameRoutes';
import { GameStateManager } from './services/gameService';
import { SessionManager } from './services/socketService';

const app = express();

export function setupApp(io: Server) {
  const gameStateManager = new GameStateManager(io);
  const sessionManager = new SessionManager();
  const gameService = new GameService(gameStateManager, sessionManager);
  
  app.use(cors());
  app.use(express.json());

  app.get('/api/test', (req, res) => {
    res.json({ message: 'Server is running' });
  });

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', mongoStatus: mongoose.connection.readyState });
  });

  app.use('/api/games', createGameRouter(gameService));

  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ 
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  });


  app.get('/api/sessions', async (req, res) => {
    const sessions = await Session.find();
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(sessions, null, 2));
  });

  return app;
}

export { app };