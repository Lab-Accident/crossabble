import { create } from 'zustand';
// import { current, produce } from 'immer';
import * as types from '../../../server/src/types/gameTypes';

interface GameStore {
    numGridCells: number;
    minGridSize: number;
    currentMenu: string;
    currentPlayer: types.Player;
    currentTeam: types.Team;
    team1Score: number;
    team2Score: number;
    setNumGridCells: (size: number) => void;
    setMenu: (newMenu: string) => void;
    setTeamScores: (team1Score: number, team2Score: number) => void;
}


const useGameStore = create<GameStore>()((set) => ({
    numGridCells: 15,
    minGridSize: 350,
    currentMenu : 'guess-word',
    currentPlayer : 'T1P1' as types.Player,
    currentTeam : 'T1' as types.Team,
    team1Score : 0,
    team2Score : 0,
    setNumGridCells: (size: number) => set({ 
        numGridCells: Math.min(Math.max(5, size), 25),
      }),
    setMenu: (newMenu : string) => set({ currentMenu: newMenu }),
    setTeamScores: (team1Score, team2Score) => set({ team1Score, team2Score }),
}));


export default useGameStore;
