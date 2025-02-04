import Cell from './Cell.tsx'

function Grid() {
  const NUM_GRID_CELLS = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--num-grid-cells'), 10);

  return (
    <div className="grid">
      {Array.from({ length: NUM_GRID_CELLS * NUM_GRID_CELLS }).map((_, index) => {
        const row = Math.floor(index / NUM_GRID_CELLS);
        const col = index % NUM_GRID_CELLS;
        const accessKey = `row${row}-col${col}`;
        return (
          <div 
            className="cell-container" 
            key={index}>
              <Cell row={row} col={col} accessKey={accessKey}/>
          </div>
        );
      })}
    </div>
  );
}

export default Grid;