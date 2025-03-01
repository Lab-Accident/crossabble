import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/crossable',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  environment: process.env.NODE_ENV || 'development',
  
  // Game settings
  defaultGameSize: 15,
  minGameSize: 5,
  maxGameSize: 25,
  
  // Session settings
  sessionCleanupInterval: 24 * 60 * 60 * 1000, // 24 hours
  gameCleanupInterval: 60 * 1000, // 1 minute
  staleSessionThreshold: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// Connection status for MongoDB
export const dbConnectionStatus = {
  disconnected: 0,
  connected: 1,
  connecting: 2,
  disconnecting: 3,
};