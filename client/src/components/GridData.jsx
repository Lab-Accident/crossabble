const NUM_GRID_CELLS = getComputedStyle(document.documentElement).getPropertyValue('--num-grid-cells');

class CellData {
    constructor({ row, col, down, letter='', num=0, owningTeam='', state='empty' }) {
        this.row = row; //int, 0-indexed
        this.col = col; //int, 0-indexed
        this.letter =  ''; //string of length 1 or '
        this.num = 0; //int, 1-indexed, 0 for no number
        this.owningTeam = owningTeam; // 'team1', 'team2', or ''
        this.state = state; // 'empty', 'guessed', 'unguessed', 'temp-block', 'block'
    
        if (typeof letter === 'string' && (letter.length === 1 || letter.length === 0) && (/^[a-zA-Z]*$/).test(letter.toUpperCase())) {
            this.letter = letter.toUpperCase();
        } else if (num !== undefined && num !== null) {
            console.warn(`Invalid letter.`);
            this.logCellData();
        }

        if (Number.isInteger(num) && num >= 0) {
            this.num = num;
        } else if (num !== undefined && num !== null) {
            console.warn(`Invalid num.`);
            this.logCellData();
        }

        if (this.row < 0 || this.col < 0 || this.row >= NUM_GRID_CELLS || this.col >= NUM_GRID_CELLS) {
            console.warn(`Invalid position.`);
            this.logCellData();
        }
        if (this.state !== 'empty' && this.state !== 'guessed' && this.state !== 'unguessed' && this.state !== 'temp-block' && this.state !== 'block') {
            console.warn(`Invalid state.`);
            this.logCellData();
        }
        if (this.owningTeam !== 'team1' && this.owningTeam !== 'team2' && this.owningTeam !== '') {
            console.warn(`Invalid team name.`);
            this.logCellData();
        }

    }
    logCellData() {
        console.log(`CellData: row=${this.row}, col=${this.col}, letter=${this.letter}, num=${this.num}, owningTeam=${this.owningTeam}, state=${this.state}`);
    }

}

class GridData {
    constructor() {
        this.GridData = Array.from({ length: NUM_GRID_CELLS }, (_, row) =>
            Array.from({ length: NUM_GRID_CELLS }, (_, col) => new CellData({ row: row, col: col }))
        );
    }

    getCellData(row, col) {
        return this.GridData[row][col];
    }

    getState(row, col) {
        return this.GridData[row][col].state;
    }
    getLetter(row, col) {
        return this.GridData[row][col].letter;
    }
    getNum(row, col) {
        return this.GridData[row][col].num;
    }
    getOwningTeam(row, col) {
        return this.GridData[row][col].owningTeam;
    }

    logGridDataFull() {
        this.GridData.forEach(row => 
            row.forEach(CellData => 
                CellData.logCellData()));
    }

    logGridLettersPretty() {
        let output = "";
        for (let i = 0; i < NUM_GRID_CELLS; i++) {
            for (let j = 0; j < NUM_GRID_CELLS; j++) {
                output += this.GridData[i][j].letter + " ";
            }
            output += "\n";
        }
        console.log(output);
    }

    logGridNumsPretty() {
        let output = "";
        for (let i = 0; i < NUM_GRID_CELLS; i++) {
            for (let j = 0; j < NUM_GRID_CELLS; j++) {
                output += this.GridData[i][j].num + " ";
            }
            output += "\n";
        }
        console.log(output);
    }

    logGridStatePretty() {
        let output = "";
        for (let i = 0; i < NUM_GRID_CELLS; i++) {
            for (let j = 0; j < NUM_GRID_CELLS; j++) {
                if (this.GridData[i][j].state === 'empty') {
                    output += "E_ ";
                }
                if (this.GridData[i][j].state === 'guessed') {
                    output += "G";
                    if (this.GridData[i][j].owningTeam === 'team1') {
                        output += "1 ";
                    } else {
                        output += "2 ";
                    }
                }
                if (this.GridData[i][j].state === 'unguessed') {
                    output += "U";
                    if (this.GridData[i][j].owningTeam === 'team1') {
                        output += "1 ";
                    } else {
                        output += "2 ";
                    }
                }
                if (this.GridData[i][j].state === 'temp-block') {
                    output += "T_ ";
                }
                if (this.GridData[i][j].state === 'block') {
                    output += "B_ ";
                }
            }
            output += "\n";
        }
        console.log(output);
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
        if (this.GridData[row][col].state === 'empty' || this.GridData[row][col].state === 'temp-block') {
            this.GridData[row][col].state = 'block';
        }
    }

    setTempBlock(row, col) {
        if (this.GridData[row][col].state === 'empty') {
            this.GridData[row][col].state = 'temp-block';
        }
    }


    setTempBlockAdjacentCells(row, col, down) {
        if (down) {
            if (col > 0) {
                this.setTempBlock(row, col - 1);
            }
            if (col + 1 < NUM_GRID_CELLS) {
                this.setTempBlock(row, col + 1);
            }
        } else {
            if (row > 0) {
                this.setTempBlock(row - 1, col);
            }
            if (row + 1 < NUM_GRID_CELLS) {
                this.setTempBlock(row + 1, col);
            }
        }
    }

    showUnguessedCellLettersFromWord(wordData, word) {
        const { row, col, down, length} = wordData;
        for (let i = 0; i < length; i++) {
            if (down) {
                this.setLetter(row + i, col, word[i])
            } else {
                this.setLetter(row, col + i, word[i])
            }
        }
    }

    setUnguessedCellsFromWord(wordData) {
        const { row, col, down, length, num, team} = wordData;
        this.setNum(row, col, num)

        for (let i = 0; i < length; i++) {
            if (down) {
                this.setUnguessed(row + i, col, team)
                this.setTempBlockAdjacentCells(row + i, col, down)
            } else {
                this.setUnguessed(row, col + i, team)
                this.setTempBlockAdjacentCells(row, col + i, down)
            }
        }
        // block CellData before word 
        // maybe changed to temp-block later?
        if (down) {
            if (row > 0) {
                this.setBlock(row - 1, col);
            }
        } else {
            if (col > 0) {
                this.setBlock(row, col - 1);
            }
        }

        // permanently block CellData after word
        // maybe changed to temp-block later?
        if (down) {
            if (row + length < NUM_GRID_CELLS) {
                this.setBlock(row + length, col);
            }
        } else {
            if (col + length < NUM_GRID_CELLS) {
                this.setBlock(row, col + length);
            }
        }

    }

    setGuessedCellsFromWord(publicWord) {
        // publicWord.logPublicWord();
        const { word, row, col, down, length} = publicWord;
        this.setNum(row, col, 0);
        for (let i = 0; i < length; i++) {
            if (down) {
                this.setGuessed(row + i, col, word[i])
                this.removeAdjacentTempBlocks(row + i, col, down)
            } else {
                this.setGuessed(row, col + i, word[i])
                this.removeAdjacentTempBlocks(row, col + i, down)
            }
            // this.logGridStatePretty();
        }

        // // remove temp block CellData before word
        // if (down) {
        //     if (row > 0) {
        //         this.removeTempBlock(row - 1, col);
        //     }
        // } else {
        //     if (col > 0) {
        //         this.removeTempBlock(row, col - 1);
        //     }
        // }
    }

    removeTempBlock(row, col) {
        // check all adjacent CellDatas for unguessed CellDatas
        if (row > 0) {
            console.log('     -1', row-1, col)
            if (this.GridData[row - 1][col].state === 'unguessed') {
                return;
            }
        }
        if (row + 1 < NUM_GRID_CELLS) {
            console.log('    -2', row+1, col)
            if (this.GridData[row + 1][col].state === 'unguessed') {
                return;
            }
        }
        if (col > 0) {
            console.log('     -3', row, col-1)
            if (this.GridData[row][col - 1].state === 'unguessed') {
                return;
            }
        }
        if (col + 1 < NUM_GRID_CELLS) {
            if (this.GridData[row][col + 1].state === 'unguessed') {
                return;
            }
        }
        if (this.GridData[row][col].state === 'temp-block') {
            this.setEmpty(row, col);
        }
    }

    removeAdjacentTempBlocks(row, col, down) {
        if (down) {
            if (col > 0) {
                this.removeTempBlock(row, col - 1);
            }
            if (row + 1 < NUM_GRID_CELLS) {
                this.removeTempBlock(row, col + 1);
            }
        } else {
            if (row > 0) {
                this.removeTempBlock(row - 1, col);
            }
            if (col + 1 < NUM_GRID_CELLS) {
                this.removeTempBlock(row + 1, col);
            }
        }
    }

    static deepCopy(sourceGridData) {
        let newGridData = new GridData();
        newGridData.GridData = sourceGridData.map(row => row.map(CellData => new CellData(CellData)));
        return newGridData;
    }

}

export { CellData, GridData };