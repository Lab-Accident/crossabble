import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/crossable');
    console.log('MongoDB connected');
    
    mongoose.connection.on('error', err => {
      console.error('MongoDB connection error:', err);
    });

    if (mongoose.connection.db) {
      const indexes = await mongoose.connection.db.collection('sessions').indexes();
      const ttlIndexes = indexes.filter(idx => idx.expireAfterSeconds !== undefined);
      if (ttlIndexes.length > 0) {
        console.warn('⚠️ WARNING: Found TTL indexes on sessions collection:');
        console.warn(JSON.stringify(ttlIndexes, null, 2));
        
        // Ask if you want to drop them automatically
        // console.warn('Dropping problematic TTL indexes...');
        // for (const idx of ttlIndexes) {
        //   if (idx.expireAfterSeconds !== undefined && idx.expireAfterSeconds <= 96000) { // Only drop short-lived indexes (<=1 hour)
        //     console.log(`Dropping index ${idx.name} with expireAfterSeconds=${idx.expireAfterSeconds}`);
        //     if (idx.name) {
        //       await mongoose.connection.db.collection('sessions').dropIndex(idx.name);
        //     }
        //   }
        // }
      } else {
        console.log('✅ No TTL indexes found on sessions collection.');
      }
    }

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};