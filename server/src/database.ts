import mongoose from 'mongoose';
import dotenv from 'dotenv';
import logger from './utils/logger';
import { config } from './config';

dotenv.config();

export const connectDB = async () => {
  try {
    logger.info('Connecting to MongoDB');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/crossable');
    logger.info('MongoDB connected successfully');

    mongoose.connection.on('error', err => {
      logger.error(err, 'MongoDB connection error');
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    if (mongoose.connection.db) {
      logger.debug('Checking for problematic TTL indexes');
      const indexes = await mongoose.connection.db.collection('sessions').indexes();
      const ttlIndexes = indexes.filter(idx => idx.expireAfterSeconds !== undefined);
      
      if (ttlIndexes.length > 0) {
        logger.warn({ ttlIndexes }, 'Found TTL indexes on sessions collection');        
      } else {
        logger.info('No TTL indexes found on sessions collection');      }
    }

    return mongoose.connection;
  } catch (error) {
    logger.error(error as Error, 'Failed to connect to MongoDB');
    process.exit(1);
  }
};

export const disconnectDB = async () => {
  try {
    logger.info('Disconnecting from MongoDB');
    await mongoose.disconnect();
    logger.info('MongoDB disconnected successfully');
  } catch (error) {
    logger.error(error as Error, 'Error disconnecting from MongoDB');
  }
};
