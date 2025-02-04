import { create } from 'zustand';
// import { current, produce } from 'immer';
import * as types from '../../../server/src/types/gameTypes';

interface GameStore {
    currentMenu: string;
    currentPlayer: types.Player;
    currentTeam: types.Team;
    team1Score: number;
    team2Score: number;
    setMenu: (newMenu: string) => void;
    setTeamScores: (team1Score: number, team2Score: number) => void;
}


const useGameStore = create<GameStore>()((set) => ({
    currentMenu : 'guess-word',
    currentPlayer : 'T1P1' as types.Player,
    currentTeam : 'T1' as types.Team,
    team1Score : 0,
    team2Score : 0,
    setMenu: (newMenu : string) => set({ currentMenu: newMenu }),
    setTeamScores: (team1Score, team2Score) => set({ team1Score, team2Score }),
}));


export default useGameStore;
