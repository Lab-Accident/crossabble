const NUM_GRID_CELLS = getComputedStyle(document.documentElement).getPropertyValue('--num-grid-cells');

class WordData {
    constructor({ clue, team, row, col, num, down, length }) {
        //clue
        this.clue = clue; //string
        this.num = num; //int, 1-indexed

        //owner
        this.team = team; // 'T1' or 'T2'

        //position
        this.row = row; //int, 0-indexed
        this.col = col; //int, 0-indexed
        this.down = down; //bool

        //length
        this.length = length; //int

        if (this.length + this.row > NUM_GRID_CELLS - 1 || this.length + this.col > NUM_GRID_CELLS - 1) {
            throw new Error('Word length exceeds grid dimensions.');
        }
        if (this.team !== 'T1' && this.team !== 'T2') {
            throw new Error('Invalid team name.');
        }
        if (this.row < 0 || this.col < 0 || this.row >= NUM_GRID_CELLS || this.col >= NUM_GRID_CELLS) {
            throw new Error('Invalid position.');
        }
        if (this.num < 1) {
            throw new Error('Invalid number.');
        }
        if (this.down !== true && this.down !== false) {
            throw new Error('Invalid direction.');
        }
        if (this.clue == '') {
            throw new Error('Clue cannot be empty.');
        }
    }
}

class PublicWord extends WordData {
    constructor({ word, length = word.length, ...rest }) {
        super(rest);
        this.word = word;
        this.length = length;

        if (this.word.length !== this.length) {
            throw new Error('Word length does not match the provided length.');
        }
        if (this.word == '') {
            throw new Error('Word cannot be empty.');
        }
    }

    getWordData() {
        return new WordData(this);
    }
}

export { PublicWord, WordData };