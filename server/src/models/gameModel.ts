import mongoose, { Schema, Model, Document } from 'mongoose';
import * as types from '../types/gameTypes';

export interface IGame extends Document {
    gameCode: string;
    status: types.GameStatus;
    grid: types.Cell[][];
    words: types.Word[];
    currentTurn: types.Player;
    players: {
        [types.Player.Team1_Player1]: types.PlayerState;
        [types.Player.Team1_Player2]: types.PlayerState;
        [types.Player.Team2_Player1]: types.PlayerState;
        [types.Player.Team2_Player2]: types.PlayerState;
    };
    turnStartedAt: Date;
    score: {
        team1: number;
        team2: number;
    };
    toClientJSON: (requestingPlayer?: types.Player) => IGame;
}

const PlayerStateSchema = new Schema({
    sessionId: { 
        type: String, 
        default: null 
    },
    connected: { 
        type: Boolean, 
        default: false 
    },
    forfeited: { 
        type: Boolean, 
        default: false 
    },
    lastActive: { 
        type: Date, 
        default: Date.now 
    }
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
    letter: { 
        type: String, 
        default: null 
    },
    number: { 
        type: Number, 
        required: false, 
        default: null 
    },
    playedBy: {
        type: String,
        enum: Object.values(types.Player),
        default: null
    }
});

const WordSchema = new Schema({
    word: { 
        type: String, 
        default: null 
    },
    clue: { 
        type: String, 
        required: true 
    },
    playedBy: { 
        type: String,
        enum: Object.values(types.Player),
        default: null
    },
    position: {
        row: { type: Number, required: true },
        col: { type: Number, required: true }
    },
    down: { 
        type: Boolean, 
        required: true 
    },
    length: { 
        type: Number, 
        required: true 
    },
    number: { 
        type: Number, 
        required: true 
    },
    revealed: { 
        type: Boolean, 
        required: true, default: false 
    }
})

const GameSchema = new Schema({
    gameCode: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        minlength: 4,
        maxlength: 6,
        validate: {
            validator: function(v: string) {
                return /^[A-Z0-9]{4,6}$/.test(v);
            },
            message: 'Game code must be 4-6 alphanumeric characters'
        }
    },
    status: {
        type: String,
        enum: Object.values(types.GameStatus),
        default: types.GameStatus.Waiting
    },
    grid: [[CellSchema]],
    words: [WordSchema],
    currentTurn: { 
        type: String,
        enum: Object.values(types.Player),
        required: true,
        default: types.Player.Team1_Player1
    },
    turnStartedAt: { 
        type: Date, 
        default: Date.now 
    },
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
        players: doc.players,

        // Hide letters unless revealed or played by requesting player
        grid: doc.grid.map((row: types.Cell[]) => 
            row.map(cell => ({
                ...cell,
                letter: 
                    doc.status === types.GameStatus.Finished ||
                    cell.state === types.CellState.Guessed ||
                    cell.playedBy === requestingPlayer
                ? cell.letter : null
            }))
        ),

        // Hide words unless revealed or owned by requesting player
        words: doc.words.map((word: types.Word) => ({
            ...word,
            word: 
                word.revealed || 
                (word.playedBy === requestingPlayer)
            ? word.word : null
        }))
    };
};

export const Game = mongoose.model<IGame>('Game', GameSchema);