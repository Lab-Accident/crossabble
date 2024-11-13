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

export interface Position {
    row: number;
    col: number;
}

export interface SharedCell {
    position: Position;
    state: CellState;
    team: Team;
    letter?: string;
    number?: number;
}

export interface SharedWord {
    id: string;
    word: string;
    clue: string;
    team: Team;
    position: Position;
    isVertical: boolean;
    length: number;
}