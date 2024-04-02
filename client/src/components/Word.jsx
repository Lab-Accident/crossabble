const NUM_GRID_CELLS = getComputedStyle(document.documentElement).getPropertyValue('--num-grid-cells');

class WordData {
    constructor({ clue, team, row, col, num, down, length }) {
        //clue
        this.clue = clue;           //string
        this.num = num;             //int, 1-indexed, 0 for no number

        //owner
        this.team = team;           // 'team1' or 'team2'

        //position
        this.row = row;             //int, 0-indexed
        this.col = col;             //int, 0-indexed
        this.down = down;           //bool (true if down, false if across)

        //length
        this.length = length;       //int

        if (this.length + this.row > NUM_GRID_CELLS - 1 || this.length + this.col > NUM_GRID_CELLS - 1) {
            console.warn(`Word length exceeds grid dimensions.`);
            this.logWordData();
        }
        
        if (this.team === 'T1') {
            this.team = 'team1';
        } else if (this.team === 'T2') {
            this.team = 'team2';
        } else if (this.team !== 'team1' && this.team !== 'team2') {
            console.warn(`Invalid team name.`);
            this.logWordData();
        }
        
        if (this.row < 0 || this.col < 0 || this.row >= NUM_GRID_CELLS || this.col >= NUM_GRID_CELLS) {
            console.warn(`Invalid position.`);
            this.logWordData();
        }
        if (this.num < 1) {
            console.warn(`Invalid number.`);
            this.logWordData();
        }
        if (this.down !== true && this.down !== false) {
            console.warn(`Invalid direction. WordData: clue=${this.clue}, team=${this.team}, row=${this.row}, col=${this.col}, num=${this.num}, down=${this.down}, length=${this.length}`);
            this.logWordData();
        }
        if (this.clue == '') {
            console.warn(`Clue cannot be empty. WordData: clue=${this.clue}, team=${this.team}, row=${this.row}, col=${this.col}, num=${this.num}, down=${this.down}, length=${this.length}`);
            this.logWordData();
        }
    }
    
    logWordData() {
        console.log(`WordData: clue=${this.clue}, team=${this.team}, row=${this.row}, col=${this.col}, num=${this.num}, down=${this.down}, length=${this.length}`);
    }

    getPublicWord(word) {
        return new PublicWord({
            word: word,
            length: this.length,
            clue: this.clue,
            team: this.team,
            row: this.row,
            col: this.col,
            num: this.num,
            down: this.down
        });
    }
}

class PublicWord extends WordData {
    constructor({ word, length = word.length, ...rest }) {
        super(rest);
        this.word = word;
        this.length = length;

        if (this.word.length !== this.length) {
            console.log(`Word length does not match the provided length.`);
            this.logPublicWord();
        }
        if (this.word == '') {
            console.log(`Word cannot be empty.`);
            this.logPublicWord();
        }
    }

    getWordData() {
        return new WordData(this);
    }

    logPublicWord() {
        console.log(`PublicWord: word=${this.word}, clue=${this.clue}, team=${this.team}, row=${this.row}, col=${this.col}, num=${this.num}, down=${this.down}, length=${this.length}`);
    }
}

export { PublicWord, WordData };