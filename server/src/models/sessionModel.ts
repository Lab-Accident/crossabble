import mongoose, { Schema, Model, Document } from 'mongoose';
import { Player } from '../types/gameTypes';
import logger from '../utils/logger';

export interface ISession extends Document {
    sessionId: string;
    gameCode: string | null;
    playerPosition: Player | null;
    lastSeen: Date;
    createdAt: Date;
    debug: {
        refreshCount: number;
        lastRefreshed: Date | null;
        browser: string | null;
        userAgent: string | null;
    };
}

const SessionSchema = new Schema({
    sessionId: { type: String, required: true, unique: true },
    gameCode: { type: String, required: false },
    playerPosition: { 
        type: String,
        enum: Object.values(Player),
        required: false
    },
    lastSeen: { type: Date, default: Date.now },
    debug: {
        refreshCount: { type: Number, default: 0 },
        lastRefreshed: { type: Date, default: null },
        browser: { type: String, default: null },
        userAgent: { type: String, default: null }
      }
}, { timestamps: true, strict: false });


// Add hooks for monitoring
SessionSchema.pre('findOne', function() {
    logger.debug({ filter: this.getFilter() }, 'Looking up session');
  });
  
  SessionSchema.post('findOne', function(doc) {
    if (doc) {
      logger.debug({ sessionId: doc.sessionId, lastSeen: doc.lastSeen }, 'Session found');
    } else {
      logger.warn({ filter: this.getFilter() }, 'Session not found');
    }
  });
  
  SessionSchema.pre('save', function() {
    if (this.isModified('lastSeen')) {
      // Increment refresh count on lastSeen update
      if (this.debug) {
        this.debug.refreshCount = (this.debug.refreshCount || 0) + 1;
        this.debug.lastRefreshed = new Date();
      }
      logger.debug({ sessionId: this.sessionId, refreshCount: this.debug?.refreshCount }, 'Updating session');
    }
  });
  
  SessionSchema.post('save', function(doc) {
    logger.debug({ sessionId: doc.sessionId, lastSeen: doc.lastSeen }, 'Session updated');
  });
  
  SessionSchema.post('deleteMany', function(result) {
    logger.debug(`Deleted ${result.deletedCount} sessions`);
  });
  
  // Index optimization
  SessionSchema.index({ gameCode: 1, playerPosition: 1 });
  SessionSchema.index({ lastSeen: 1 });
  

export const Session = mongoose.model<ISession>('Session', SessionSchema);