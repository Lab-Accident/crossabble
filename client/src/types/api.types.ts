import { GameState } from './game.types';
import { Position, Team } from '../shared/types';

export interface ApiResponse<T> {
    success: boolean;
    data: T;
    error?: string;
}

export interface CreateGameRequest {
    gridSize: number;
    teams: {
        team1: string[];
        team2: string[];
    };
}

export interface MakeMoveRequest {
    gameId: string;
    position: Position;
    letter: string;
    team: Team;
}

export interface GameStateResponse extends ApiResponse<GameState> {}
