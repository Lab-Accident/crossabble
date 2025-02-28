import { setupApp } from './app';
import { connectDB } from './database';
import dotenv from 'dotenv';
import { createSocketService } from './services/socketService';
import { createServer } from 'http';
import { Server } from 'socket.io';

dotenv.config();

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await connectDB();
    
    const httpServer = createServer();
    const io = new Server(httpServer, {
      cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        methods: ['GET', 'POST']
      }
    });

    const app = setupApp(io);
    httpServer.on('request', app);

    const socketService = createSocketService(io);

    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();