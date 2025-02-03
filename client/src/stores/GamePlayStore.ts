import { create } from 'zustand';
// import { current, produce } from 'immer';
import * as types from '../../../server/src/types/gameTypes';

type ActivePlayer = Exclude<types.Player, types.Player.None>;
type ActiveTeam = Exclude<types.Team, types.Team.None>;

interface GameStore {
    currentMenu: string;
    currentPlayer: ActivePlayer;
    currentTeam: ActiveTeam;
    team1Score: number;
    team2Score: number;
    setMenu: (newMenu: string) => void;
    setTeamScores: (team1Score: number, team2Score: number) => void;
}

const playerRotation: ActivePlayer[] = [
    types.Player.Team1_Player1,
    types.Player.Team2_Player1,
    types.Player.Team1_Player2,
    types.Player.Team2_Player2,
];

const getTeamFromPlayer = (player: ActivePlayer): ActiveTeam => 
    player.startsWith('T1') ? types.Team.Team1 : types.Team.Team2;

const useGameStore = create<GameStore>()((set) => ({
    currentMenu : 'guess-word',
    currentPlayer : 'T1P1' as ActivePlayer,
    currentTeam : 'T1' as ActiveTeam,
    team1Score : 0,
    team2Score : 0,
    setMenu: (newMenu : string) => set({ currentMenu: newMenu }),
    setTeamScores: (team1Score, team2Score) => set({ team1Score, team2Score }),
}));


export default useGameStore;
