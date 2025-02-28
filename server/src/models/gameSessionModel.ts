import mongoose, { Schema, Model, Document } from 'mongoose';
import { Player } from '../types/gameTypes';


const ONE_DAY= 24 * 60 * 60;
const ONE_MINUTE = 60;

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
    console.log(`[SessionSchema] Looking up session: ${JSON.stringify(this.getFilter())}`);
  });
  
  SessionSchema.post('findOne', function(doc) {
    if (doc) {
      console.log(`[SessionSchema] Found session: ${doc.sessionId}, last seen: ${doc.lastSeen}`);
    } else {
      console.log(`[SessionSchema] Session not found for query: ${JSON.stringify(this.getFilter())}`);
    }
  });
  
  SessionSchema.pre('save', function() {
    if (this.isModified('lastSeen')) {
      // Increment refresh count on lastSeen update
      if (this.debug) {
        this.debug.refreshCount = (this.debug.refreshCount || 0) + 1;
        this.debug.lastRefreshed = new Date();
      }
      console.log(`[SessionSchema] Updating session ${this.sessionId}, refresh #${this.debug?.refreshCount}`);
    }
  });
  
  SessionSchema.post('save', function(doc) {
    console.log(`[SessionSchema] Saved session: ${doc.sessionId}, last seen: ${doc.lastSeen}`);
  });
  
  SessionSchema.post('deleteMany', function(result) {
    console.log(`[SessionSchema] Deleted ${result.deletedCount} sessions`);
  });
  
  // Index optimization
  SessionSchema.index({ gameCode: 1, playerPosition: 1 });
  SessionSchema.index({ lastSeen: 1 });
  

export const Session = mongoose.model<ISession>('Session', SessionSchema);