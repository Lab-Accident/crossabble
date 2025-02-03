import { create } from 'zustand';
import * as types from '../../../server/src/types/gameTypes';

type ActivePlayer = Exclude<types.Player, types.Player.None>;

interface GameSession {
    gameCode: string;
    playerPosition: types.Player;
    sessionId: string;
}

interface SessionStore {
    currentSession: GameSession | null;
    gameStatus: 'waiting' | 'playing' | 'finished';
    currentTurn: ActivePlayer;

    joinGame: (gameCode: string, playerPosition: types.Player) => void;
    reconnectToGame: () => Promise<boolean>;
    leaveGame: () => void;

    setGameStatus: (status: 'waiting' | 'playing' | 'finished') => void;
    setCurrentTurn: (turn: ActivePlayer) => void;
}

const generateSessionId = () => Math.random().toString(36).substr(2, 15);

const saveSession = (session: GameSession) => {
    localStorage.setItem('gameSession', JSON.stringify(session));
};

const loadSession = (): GameSession | null => {
    const savedSession = localStorage.getItem('gameSession');
    return savedSession ? JSON.parse(savedSession) : null;
};

const useSessionStore = create<SessionStore>((set) => ({
    currentSession: loadSession(),
    gameStatus: 'waiting',
    currentTurn: 'T1P1' as ActivePlayer,

    joinGame: (gameCode: string, playerPosition: types.Player) => {
        const sessionId = generateSessionId();
        const newSession: GameSession = { 
            gameCode, 
            playerPosition, 
            sessionId 
        };
        saveSession(newSession);
        set({ currentSession: newSession });
    },

    reconnectToGame: async () => {
        const session = loadSession();
        if (!session) return false;

        try {
            const response = await fetch(`/api/games/reconnect/${session.gameCode}`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ 
                    sessionId: session.sessionId, 
                    playerPosition: session.playerPosition 
                })
            });

            if (response.ok) {
                const gameState = await response.json();
                set({
                    currentSession: session,
                    gameStatus: gameState.status,
                    currentTurn: gameState.currentTurn
                 });
                return true;
            }
        } catch (error) {
            console.error('Failed to reconnect to game:', error);
        }
        localStorage.removeItem('gameSession');
        set({ currentSession: null });
        return false;
    },

    leaveGame: () => {
        localStorage.removeItem('gameSession');
        set({ 
            currentSession: null, 
            gameStatus: 'waiting', 
            currentTurn: 'T1P1' as ActivePlayer
         });
    },

    setGameStatus: (status) => set({ gameStatus: status }),
    setCurrentTurn: (turn) => set({ currentTurn: turn })

}));

export default useSessionStore;