import { Team, SharedCell, SharedWord } from '../shared/types';
import { GameStatus, PlayerRole } from './enums';

export interface GameCell extends SharedCell {
    isHighlighted: boolean;
    isSelected: boolean;
}

export interface GameWord extends SharedWord {
    isRevealed: boolean;
    isComplete: boolean;
}

export interface GameState {
    gameId: string;
    status: GameStatus;
    currentTurn: Team;
    grid: GameCell[][];
    words: GameWord[];
    players: Player[];
    score: Score;
}

export interface Player {
    id: string;
    name: string;
    team: Team;
    role: PlayerRole;
}

export interface Score {
    team1: number;
    team2: number;
}
