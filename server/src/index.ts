import { app } from './app';
import { connectDB } from './database';
import dotenv from 'dotenv';
import { createSocketService } from './services/socketService';
import { createServer } from 'http';

dotenv.config();

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await connectDB();
    
    const httpServer = createServer(app);
    const socketService = createSocketService(httpServer);

    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();