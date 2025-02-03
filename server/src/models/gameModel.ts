import mongoose, { Schema, Model, Document } from 'mongoose';
import * as types from '../types/gameTypes';

interface PlayerState {
    sessionId: string | null;
    connected: boolean;
    forfeited: boolean;
    lastActive: Date;
}

export interface ICell {
    position: types.Position;
    state: types.CellState;
    letter?: string;
    number?: number;
    team: types.Team;
    playedBy?: types.Player;
}

interface IWord extends Document {
    word: string | null;
    clue: string;
    owner: types.Player;
    position: types.Position;
    down: boolean;
    length: number;
    number: number;
    revealed: boolean;
}

interface IGame extends Document {
    gameCode: string;
    status: 'waiting' | 'active' | 'paused' | 'completed';
    grid: ICell[][];
    words: IWord[];
    currentTurn: types.Player;
    turnStartedAt: Date;
    players: {
        [key in types.Player]: PlayerState;
    };
    score: {
        team1: number;
        team2: number;
    };
    toClientJSON: (requestingPlayer?: types.Player) => any;
}

const PlayerStateSchema = new Schema({
    sessionId: { type: String, default: null },
    connected: { type: Boolean, default: false },
    forfeited: { type: Boolean, default: false },
    lastActive: { type: Date, default: Date.now }
});

const CellSchema = new Schema({
    position: {
        row: { type: Number, required: true },
        col: { type: Number, required: true }
    },
    state: { 
        type: String, 
        enum: Object.values(types.CellState), 
        default: types.CellState.Empty
    },
    letter: { type: String, default: '' },
    number: { type: Number, required: false, default: null },
    team: {
        type: String,
        enum: Object.values(types.Team),
        default: types.Team.None
    },
    playedBy: {
        type: String,
        enum: Object.values(types.Player),
        default: types.Player.None
    }
});

const WordSchema = new Schema({
    word: { type: String, default: null },
    clue: { type: String, required: true },
    owner: { 
        type: String,
        enum: Object.values(types.Player),
        default: types.Player.None
    },
    position: {
        row: { type: Number, required: true },
        col: { type: Number, required: true }
    },
    down: { type: Boolean, required: true },
    length: { type: Number, required: true },
    number: { type: Number, required: true },
    revealed: { type: Boolean, required: true, default: false }
})

const GameSchema = new Schema({
    gameCode: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        minlength: 4,
        maxlength: 6
    },
    status: {
        type: String,
        enum: ['waiting', 'active', 'paused', 'completed'],
        default: 'waiting'
    },
    grid: [[CellSchema]],
    words: [WordSchema],
    currentTurn: { 
        type: String,
        enum: Object.values(types.Player),
        required: true,
        default: types.Player.Team1_Player1
    },
    turnStartedAt: { type: Date, default: Date.now },
    players: {
        [types.Player.Team1_Player1]: PlayerStateSchema,
        [types.Player.Team1_Player2]: PlayerStateSchema,
        [types.Player.Team2_Player1]: PlayerStateSchema,
        [types.Player.Team2_Player2]: PlayerStateSchema
    },
    score: {
        team1: { type: Number, required: true, default: 0 },
        team2: { type: Number, required: true, default: 0 }
    }
}, {timestamps: true})

GameSchema.methods.toClientJSON = function(requestingPlayer?: types.Player) {
    const doc = this.toObject();
    
    return {
        gameCode: doc.gameCode,
        status: doc.status,
        currentTurn: doc.currentTurn,
        score: doc.score,
        grid: doc.grid.map((row: ICell[]) => 
            row.map((cell: ICell) => ({
                ...cell,
                letter: cell.letter && (
                    doc.status === 'completed' ||
                    (requestingPlayer && cell.playedBy === requestingPlayer)
                ) ? cell.letter : '',
            }))
        ),
        words: doc.words.map((word: IWord) => ({
            ...word,
            word: word.revealed || (requestingPlayer && word.owner === requestingPlayer)
                ? word.word
                : null
        })),
        // Add these fields for socket connection
        yourPosition: requestingPlayer || null,
        yourSessionId: requestingPlayer ? doc.players[requestingPlayer]?.sessionId : null,
        players: Object.fromEntries(
            Object.entries(doc.players as { [key: string]: PlayerState }).map(([pos, player]) => [
                pos,
                {
                    connected: player.connected,
                    forfeited: player.forfeited
                }
            ])
        )
    };
};
export const Game = mongoose.model<IGame>('Game', GameSchema)
