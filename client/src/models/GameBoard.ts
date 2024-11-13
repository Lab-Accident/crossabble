import { Position } from '../shared/types';
import { Cell } from './Cell';
import { GameState } from '../types/game.types';

export class GameBoard {
    private grid: Cell[][];

    constructor(size: number) {
        this.grid = Array.from({ length: size }, (_, row) =>
            Array.from({ length: size }, (_, col) => 
                new Cell({ row, col }))
        );
    }

    public getCell(position: Position): Cell {
        return this.grid[position.row][position.col];
    }

    public setCell(position: Position, cell: Partial<Cell>): void {
        const currentCell = this.getCell(position);
        Object.assign(currentCell, cell);
    }

    public resetBoard(): void {
        this.grid.forEach(row =>
            row.forEach(cell => cell.reset())
        );
    }

    public getState(): GameState['grid'] {
        return this.grid.map(row =>
            row.map(cell => ({ ...cell }))
        );
    }

    public validatePosition(position: Position): boolean {
        return position.row >= 0 &&
               position.row < this.grid.length &&
               position.col >= 0 &&
               position.col < this.grid[0].length;
    }

    public getAdjacentCells(position: Position): Cell[] {
        const adjacent: Cell[] = [];
        const directions = [
            [-1, 0], [1, 0], [0, -1], [0, 1]
        ];

        directions.forEach(([dRow, dCol]) => {
            const newPosition = {
                row: position.row + dRow,
                col: position.col + dCol
            };

            if (this.validatePosition(newPosition)) {
                adjacent.push(this.getCell(newPosition));
            }
        });

        return adjacent;
    }
}