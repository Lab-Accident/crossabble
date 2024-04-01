const NUM_GRID_CellDataS = getComputedStyle(document.documentElement).getPropertyValue('--num-grid-CellDatas');

class CellData {
    constructor({ row, col, letter='', num=undefined, owningTeam='', state='empty' }) {
        this.row = row; //int, 0-indexed
        this.col = col; //int, 0-indexed
        this.letter = letter; //string
        this.num = num; //int
        this.owningTeam = owningTeam; // 'team1', 'team2', or ''
        this.state = state; // 'empty', 'guessed', 'unguessed', 'temp-block', 'block'
    
        if (typeof letter === 'string' && letter.length === 1 && LETTER_REGEX.test(/^[A-Z]$/)) {
            this.letter = letter;
        } else if (letter !== undefined && letter !== null) {
            throw new Error('Invalid letter.');
        }

        if (num !== undefined && num !== null && Number.isInteger(num) && num >= 0) {
            this.num = num;
        } else if (num !== undefined && num !== null) {
            throw new Error('Invalid num.');
        }

        if (this.row < 0 || this.col < 0 || this.row >= NUM_GRID_CellDataS || this.col >= NUM_GRID_CellDataS) {
            throw new Error('Invalid position.');
        }
        if (this.state !== 'empty' && this.state !== 'guessed' && this.state !== 'unguessed' && this.state !== 'temp-block' && this.state !== 'block') {
            throw new Error('Invalid state.');
        }
        if (this.owningTeam !== 'team1' && this.owningTeam !== 'team2' && this.owningTeam !== '') {
            throw new Error('Invalid team name.');
        }
    }

}

class GridData {
    constructor() {
        this.GridData = Array.from({ length: NUM_GRID_CellDataS}, () => Array.from({ length: NUM_GRID_CellDataS }, () => new CellData({ row, col })));
    }

    setEmpty(row, col) {
        this.GridData[row][col].state = 'empty';
    }

    setUnguessed(row, col, owningTeam) {
        this.GridData[row][col].owningTeam = owningTeam;
        this.GridData[row][col].state = 'unguessed';
    }

    setNum(row, col, num) {
        this.GridData[row][col].num = num;
    }

    setGuessed(row, col, letter) {
        this.GridData[row][col].letter = letter;
        this.GridData[row][col].state = 'guessed';
    }

    setLetter(row, col, letter) {
        this.GridData[row][col].letter = letter;
    }
    
    setBlock(row, col) {
        if (this.GridData[row][col].state === 'empty') {
            this.GridData[row][col].state = 'block';
        }
    }

    setTempBlock(row, col) {
        if (this.GridData[row][col].state === 'empty') {
            this.GridData[row][col].state = 'temp-block';
        }
    }


    setTempBlockAdjacentCellDatas(row, col, down) {
        if (down) {
            if (row > 0) {
                this.setTempBlock(row - 1, col);
            }
            if (row + 1 < NUM_GRID_CellDataS) {
                this.setTempBlock(row + 1, col);
            }
        } else {
            if (col > 0) {
                this.setTempBlock(row, col - 1);
            }
            if (col + 1 < NUM_GRID_CellDataS) {
                this.setTempBlock(row, col + 1);
            }
        }
    }

    showUnguessedCellDataLettersFromWord(wordData, word) {
        const { row, col, down, length} = wordData;
        for (let i = 0; i < length; i++) {
            if (down) {
                this.setLetter(row + i, col, word[i])
            } else {
                this.setLetter(row, col + i, word[i])
            }
        }
    }

    setUnguessedCellDatasFromWord(wordData) {
        const { row, col, down, length, num, team} = wordData;
        this.setNum(row, col, num)

        for (let i = 0; i < length; i++) {
            if (down) {
                this.setUnguessed(row + i, col, team)
                this.setTempBlockAdjacentCellDatas(row + i, col, down)
            } else {
                this.setUnguessed(row, col + i, team)
                this.setTempBlockAdjacentCellDatas(row, col + i, down)
            }
        }
        // temporarily block CellData before word
        if (down) {
            if (row > 0) {
                this.setTempBlock(row - 1, col);
            }
        } else {
            if (col > 0) {
                this.setTempBlock(row, col - 1);
            }
        }

        // permanently block CellData after word
        if (down) {
            if (row + length < NUM_GRID_CellDataS) {
                this.setBlock(row + length, col);
            }
        } else {
            if (col + length < NUM_GRID_CellDataS) {
                this.setBlock(row, col + length);
            }
        }

    }

    setGuessedCellDatasFromWord(publicWord) {
        const { word, row, col, down, length} = publicWord;

        for (let i = 0; i < length; i++) {
            if (down) {
                this.setGuessed(row + i, col, word[i])
                this.removeAdjacentTempBlocks(row + i, col)
            } else {
                this.setGuessed(row, col + i, word[i])
                this.removeAdjacentTempBlocks(row, col + i)
            }
        }

        // remove temp block CellData before word
        if (down) {
            if (row > 0) {
                this.removeTempBlock(row - 1, col);
            }
        } else {
            if (col > 0) {
                this.removeTempBlock(row, col - 1);
            }
        }
    }

    removeTempBlock(row, col) {
        // check all adjacent CellDatas for unguessed CellDatas
        if (row > 0) {
            if (this.GridData[row - 1][col].state === 'unguessed') {
                return;
            }
        }
        if (row + 1 < NUM_GRID_CellDataS) {
            if (this.GridData[row + 1][col].state === 'unguessed') {
                return;
            }
        }
        if (col > 0) {
            if (this.GridData[row][col - 1].state === 'unguessed') {
                return;
            }
        }
        if (col + 1 < NUM_GRID_CellDataS) {
            if (this.GridData[row][col + 1].state === 'unguessed') {
                return;
            }
        }
        this.setEmpty(row, col);
    }

    removeAdjacentTempBlocks(row, col) {
        if (down) {
            if (row > 0) {
                this.removeTempBlock(row - 1, col);
            }
            if (row + 1 < NUM_GRID_CellDataS) {
                this.removeTempBlock(row + 1, col);
            }
        } else {
            if (col > 0) {
                this.removeTempBlock(row, col - 1);
            }
            if (col + 1 < NUM_GRID_CellDataS) {
                this.removeTempBlock(row, col + 1);
            }
        }
    }

    deepCopy() {
        let newGridData = new GridData();
        newGridData.GridData = this.GridData.map(row => row.map(CellData => new CellData(CellData)));
        return newGridData;
    }

}

export { CellData, GridData };