export const CellState = {
    Empty : 'empty',
    Guessed : 'guessed',
    Unguessed : 'unguessed',
    TempBlock : 'temp-block',
    Block : 'block'
} as const;
export type CellState = typeof CellState[keyof typeof CellState];

export const Team = {
    Team1 : 'team1',
    Team2 : 'team2',
} as const;
export type Team = typeof Team[keyof typeof Team];

export const Player = {
    Team1_Player1 : "T1P1",
    Team2_Player1 : "T2P1",
    Team1_Player2 : "T1P2",
    Team2_Player2 : "T2P2",
} as const;
export type Player = typeof Player[keyof typeof Player];

export const GameStatus = {
    Waiting : 'waiting',
    Active : 'active',
    Finished : 'finished',
} as const;
export type GameStatus = typeof GameStatus[keyof typeof GameStatus];

export interface Position {
    row: number;
    col: number;
}
export interface Cell {
    position: Position;
    state: CellState;
    letter: string | null;
    number: number | null;
    playedBy: Player | null;
} 
export interface Word {
    word: string | null;
    clue: string;
    playedBy: Player | null;
    position: Position;
    down: boolean;
    length: number;
    number: number;
    revealed: boolean;
}

export interface PlayerState {
    sessionId: string | null;
    connected: boolean;
    forfeited: boolean;
    lastActive: Date;
}

export type GamePlayers = {
    [K in Player]: PlayerState;
}
export interface GameScore {
    team1: number;
    team2: number;
}

export interface GameData {
    gameCode: string;
    status: GameStatus;
    grid: Cell[][];
    gameSize: number;
    words: Word[];
    currentTurn: Player;
    players: GamePlayers;
    turnStartedAt: Date;
    score: GameScore;
}

export interface GameSession {
    gameCode: string;
    playerPosition: Player;
    sessionId: string;
}