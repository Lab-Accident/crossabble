import { Position, CellState, Team } from '../shared/types/index.ts';
import { GameCell } from '../types/game.types.ts';

export class Cell implements GameCell {
    public isHighlighted: boolean = false;
    public isSelected: boolean = false;

    constructor(
        public position: Position,
        public state: CellState = CellState.Empty,
        public team: Team = Team.None,
        public letter: string = '',
        public number?: number
    ) {}

    public toggleHighlight(): void {
        this.isHighlighted = !this.isHighlighted;
    }

    public toggleSelection(): void {
        this.isSelected = !this.isSelected;
    }

    public setState(state: CellState): void {
        this.state = state;
    }

    public setTeam(team: Team): void {
        this.team = team;
    }

    public setLetter(letter: string): void {
        this.letter = letter.toUpperCase();
    }

    public reset(): void {
        this.state = CellState.Empty;
        this.team = Team.None;
        this.letter = '';
        this.isHighlighted = false;
        this.isSelected = false;
    }
}
