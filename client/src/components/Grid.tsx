import Cell from './Cell.tsx'
import useGameStore from '../stores/GamePlayStore';

function Grid() {
  const numGridCells = useGameStore(state => state.numGridCells);

  return (
    <div className="grid" style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${numGridCells}, 1fr)`,
      gridTemplateRows: `repeat(${numGridCells}, 1fr)`,
      height: '100%',
      width: '100%'
    }}>
      {Array.from({ length: numGridCells * numGridCells }).map((_, index) => {
        const row = Math.floor(index / numGridCells);
        const col = index % numGridCells;
        const accessKey = `row${row}-col${col}`;
        return (
          <div className="cell-container" key={index}>
            <Cell row={row} col={col} accessKey={accessKey} />
          </div>
        );
      })}
    </div>
  );
}

export default Grid;