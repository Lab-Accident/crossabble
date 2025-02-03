export enum CellState {
    Empty = 'empty',
    Guessed = 'guessed',
    Unguessed = 'unguessed',
    TempBlock = 'temp-block',
    Block = 'block'
}

export enum Team {
    Team1 = 'team1',
    Team2 = 'team2',
    None = ''
}

export enum Player {
    Team1_Player1 = "T1P1",
    Team2_Player1 = "T2P1",
    Team1_Player2 = "T1P2",
    Team2_Player2 = "T2P2",
    None = ''
}

export type GameStatus = 'waiting' | 'active' | 'paused' | 'completed';

export interface Position {
    row: number;
    col: number;
}

export interface Cell {
    position: Position;
    state: CellState;
    letter?: string;
    number?: number;
    owningTeam: Team;
    playedBy?: Player;
} 

export interface Word {
    word: string | null;
    clue: string;
    owner?: Player;
    position: Position;
    down: boolean;
    length: number;
    number: number;
    revealed: boolean;
}
