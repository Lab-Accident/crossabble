import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

const app = express();
export const gameRouter = express.Router();

app.use(cors());
app.use(express.json());

app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is running' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', mongoStatus: mongoose.connection.readyState });
});

app.use('/api/games', gameRouter);

export { app };