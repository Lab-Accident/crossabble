import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { initializeSocketIO } from './socket';
import { SocketService } from './services/socketService';
import { initializeGameRouter } from './routes/gameRoutes';

const app = express();
const server = createServer(app);

const io = new Server(server, {
  cors: {
      origin: "http://localhost:5173", // Update this to match your client URL
      methods: ["GET", "POST"],
      credentials: true
  }
});
const socketService = new SocketService(io);

const gameRouter = initializeGameRouter(socketService);


app.use(cors({
  origin: "http://localhost:5173", // Match your client URL
  credentials: true
}));
app.use(express.json());

app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is running' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', mongoStatus: mongoose.connection.readyState });
});

app.use('/api/games', gameRouter);


// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Socket.IO server initialized');
});

export { app, io };