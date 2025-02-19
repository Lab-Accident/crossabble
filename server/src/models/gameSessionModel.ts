import mongoose, { Schema, Model, Document } from 'mongoose';
import * as types from '../types/gameTypes';

interface ISession extends Document {
    sessionId: string;
    gameCode: string | null;
    playerPosition: types.Player | null;
    lastSeen: Date;
}

const SessionSchema = new Schema({
    sessionId: { type: String, required: true, unique: true },
    gameCode: { type: String, required: false },
    playerPosition: { 
        type: String,
        enum: Object.values(types.Player),
        required: false
    },
    lastSeen: { type: Date, default: Date.now }
}, { timestamps: true });

SessionSchema.index({ gameCode: 1, playerPosition: 1 });

export const Session = mongoose.model<ISession>('Session', SessionSchema);