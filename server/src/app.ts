import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import gameRouter from './routes/gameRoutes';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is running' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', mongoStatus: mongoose.connection.readyState });
});

app.use('/api/games', gameRouter);

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ 
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

export { app };