import mongoose, { Schema, Model, Document } from 'mongoose';
import { Player, CellState, GameStatus, GameData, Cell, Word } from '../types/gameTypes';

export interface IGame extends Document, GameData {
    toClientJSON: (requestingPlayer?: Player) => GameData;
}

const PositionSchema = new Schema({
    row: { 
        type: Number, 
        required: true,
        validate: {
            validator: function(this: any, v: number): boolean {
                try {
                    const parent = (this as any).parent();
                    const game = parent ? parent.parent() : null;
                    return v >= 0 && v < (game?.gameSize ?? 15);
                } catch (error) {
                    return false;
                }
            },
            message: 'Row position must be within grid bounds'
        }
    },
    col: { 
        type: Number, 
        required: true,
        validate: {
            validator: function(this: any, v: number): boolean {
                try {
                    const parent = (this as any).parent();
                    const game = parent ? parent.parent() : null;
                    return v >= 0 && v < (game?.gameSize ?? 15);
                } catch (error) {
                    return false;
                }
            },
            message: 'Column position must be within grid bounds'
        }
    }
}, { _id: false });

const PlayerStateSchema = new Schema({
    sessionId: { type: String, default: null },
    connected: { type: Boolean, default: false },
    forfeited: { type: Boolean, default: false },
    lastActive: { type: Date, default: Date.now }
}, { _id: false });

const CellSchema = new Schema({
    position: { 
        type: PositionSchema, 
        required: true 
    },
    state: { 
        type: String, 
        enum: Object.values(CellState),
        default: CellState.Empty 
    },
    letter: { 
        type: String, 
        default: null,
        validate: {
            validator: (v: string | null) => v === null || /^[A-Z]$/i.test(v),
            message: 'Letter must be a single uppercase character A-Z'
        }
    },
    number: { 
        type: Number, 
        default: null,
        validate: {
            validator: (v: number | null) => v === null || (v >= 1 && v <= 99),
            message: 'Number must be an integer between 1 and 99'
        } 
    },
    playedBy: {
        type: String,
        enum:  [...Object.values(Player), null],
        default: null
    }
}, { _id: false });

const WordSchema = new Schema({
    word: { 
        type: String, 
        default: null,
        validate: {
            validator: function(this: any, v: string | null): boolean {
                try {
                    const doc = (this as any).parent();
                    const wordLength = doc?.length;
                    return v === null || (v.length === wordLength && /^[A-Z]+$/i.test(v));
                } catch (error) {
                    return false;
                }
            },
            message: 'Word must match specified length and contain only letters'
        }
    },
    clue: { 
        type: String, 
        required: true,
        validate: {
            validator: (v: string) => v.length > 0,
            message: 'Clue cannot be empty'
        }
    },
    playedBy: { 
        type: String,
        enum: [...Object.values(Player), null],
        default: null
    },
    position: { type: PositionSchema, required: true },
    down: { type: Boolean, required: true },
    length: { 
        type: Number, 
        required: true,
        validate: {
            validator: function(this: any, v: number): boolean {
                try {
                    const wordDoc = (this as any).parent();
                    const gameDoc = wordDoc?.parent();
                    const gameSize = gameDoc?.gameSize ?? 15;
                    const pos = wordDoc?.position;
                    const down = wordDoc?.down;
                    
                    if (!pos) return false;
        
                    if (down) {
                        return pos.row + v <= gameSize;
                    }
                    return pos.col + v <= gameSize;
                } catch (error) {
                    return false;
                }
            },
            message: 'Word length exceeds grid dimensions'
        }
    },
    number: { 
        type: Number, 
        required: true,
        min: [1, 'Number must be positive'],
        validate: {
            validator: (v: number) => Number.isInteger(v),
            message: 'Number must be an integer'
        }
    },
    revealed: { type: Boolean, required: true, default: false }
}, { _id: false });

const GameSchema = new Schema({
    gameCode: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        minlength: 4,
        maxlength: 6,
        validate: {
            validator: (v: string) => /^[A-Z0-9]{4,6}$/.test(v),
            message: 'Game code must be 4-6 alphanumeric characters'
        }
    },
    status: {
        type: String,
        enum: Object.values(GameStatus),
        default: GameStatus.Waiting
    },
    grid: [[CellSchema]],
    gameSize: {
        type: Number,
        required: true,
        default: 15,
        min: [5, 'Game size must be at least 5'],
        max: [25, 'Game size cannot exceed 25']
    },
    words: [WordSchema],
    currentTurn: { 
        type: String,
        enum: Object.values(Player),
        required: true,
        default: Player.Team1_Player1
    },
    turnStartedAt: { 
        type: Date, 
        default: Date.now,
        get: (d: Date) => d.toISOString(),
        set: (d: string) => new Date(d)
    },
    players: {
        type: {
            [Player.Team1_Player1]: PlayerStateSchema,
            [Player.Team1_Player2]: PlayerStateSchema,
            [Player.Team2_Player1]: PlayerStateSchema,
            [Player.Team2_Player2]: PlayerStateSchema
        },
        required: true,
        _id: false
    },
    score: {
        team1: { 
            type: Number, 
            required: true, 
            default: 0,
            validate: {
                validator: (v: number) => Number.isInteger(v) && v >= 0,
                message: 'Score must be a non-negative integer'
            }
        },
        team2: { 
            type: Number, 
            required: true, 
            default: 0,
            validate: {
                validator: (v: number) => Number.isInteger(v) && v >= 0,
                message: 'Score must be a non-negative integer'
            }
        }
    }
}, { timestamps: true });

GameSchema.index({ status: 1, gameCode: 1 });
GameSchema.index({ 'players.sessionId': 1 });

GameSchema.methods.toClientJSON = function(requestingPlayer?: Player): GameData {
    const doc = this.toObject();
    if (doc.status === GameStatus.Finished) {
        return doc;
    }
    
    return {
        gameCode: doc.gameCode,
        status: doc.status,
        currentTurn: doc.currentTurn,
        score: doc.score,
        gameSize: doc.gameSize,
        players: doc.players,
        turnStartedAt: doc.turnStartedAt,

        grid: doc.grid.map((row: Cell[]) => 
            row.map(cell => ({
                ...cell,
                letter: 
                    doc.status === GameStatus.Finished ||
                    cell.state === CellState.Guessed ||
                    cell.playedBy === requestingPlayer
                        ? cell.letter 
                        : null
            }))
        ),

        words: doc.words.map((word: Word) => ({
            ...word,
            word: word.revealed || word.playedBy === requestingPlayer
                ? word.word 
                : null
        }))
    };
};

export const Game = mongoose.model<IGame>('Game', GameSchema);