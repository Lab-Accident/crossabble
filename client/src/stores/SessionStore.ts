import { create } from 'zustand';
import * as types from '../../../server/src/types/gameTypes';
import { Socket } from 'socket.io-client';
import io from 'socket.io-client';

export interface GameSession {
    gameCode: string;
    playerPosition: types.Player;
    sessionId: string;
}
interface SessionStore {
    socket: typeof Socket | null;
    currentSession: GameSession | null;
    gameStatus: types.GameStatus;
    currentTurn: types.Player;
    debugLogs: { timestamp: string; message: string; data: any }[];

    initializeSocket: () => void;
    addDebugLog: (message: string, data: any) => void;
    joinGame: (gameCode: string, playerPosition: types.Player) => void;
    reconnectToGame: () => Promise<boolean>;
    leaveGame: () => void;
    setGameStatus: (status: types.GameStatus) => void;
    setCurrentTurn: (turn: types.Player) => void;
}


interface SessionStore {
    currentSession: GameSession | null;
    gameStatus: types.GameStatus;
    currentTurn: types.Player;

    joinGame: (gameCode: string, playerPosition: types.Player) => void;
    reconnectToGame: () => Promise<boolean>;
    leaveGame: () => void;

    setGameStatus: (status: types.GameStatus) => void;
    setCurrentTurn: (turn: types.Player) => void;
}

const generateSessionId = () => Math.random().toString(36).substr(2, 15);

const saveSession = (session: GameSession) => {
    localStorage.setItem('gameSession', JSON.stringify(session));
};

const loadSession = (): GameSession | null => {
    const savedSession = localStorage.getItem('gameSession');
    return savedSession ? JSON.parse(savedSession) : null;
};

const useSessionStore = create<SessionStore>((set, get) => ({
    socket: null,
    currentSession: loadSession(),
    gameStatus: types.GameStatus.Waiting,
    currentTurn: 'T1P1' as types.Player,
    debugLogs: [],

    initializeSocket: () => {
        const existingSessionId = get().currentSession?.sessionId;
        
        const socket = io('http://localhost:3000', {
            auth: existingSessionId ? { sessionId: existingSessionId } : undefined
        });

        socket.on('connect', () => {
            get().addDebugLog('Socket connected', { socketId: socket.id });
        });

        socket.on('session', (data: { sessionId: string }) => {
            get().addDebugLog('Session created/restored', data);
            const newSession: GameSession = {
                ...get().currentSession,
                sessionId: data.sessionId,
                gameCode: get().currentSession?.gameCode || '',
                playerPosition: get().currentSession?.playerPosition || 'T1P1' as types.Player,
            };
            saveSession(newSession);
            set({ currentSession: newSession });
        });

        socket.on('gameStateUpdate', (gameState: any) => {
            set({
                gameStatus: gameState.status,
                currentTurn: gameState.currentTurn
            });
        });

        set({ socket });
    },

    addDebugLog: (message: string, data: any) => {
        set(state => ({
            debugLogs: [{
                timestamp: new Date().toISOString(),
                message,
                data
            }, ...state.debugLogs].slice(0, 20)
        }));
    },

    // Enhanced joinGame method
    joinGame: (gameCode: string, playerPosition: types.Player) => {
        const { socket } = get();
        if (!socket) return;

        socket.emit('joinGame', { gameCode });
        const newSession: GameSession = { 
            gameCode, 
            playerPosition, 
            sessionId: get().currentSession?.sessionId || generateSessionId()
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
            gameStatus: types.GameStatus.Waiting,
            currentTurn: 'T1P1' as types.Player
         });
    },

    setGameStatus: (status) => set({ gameStatus: status }),
    setCurrentTurn: (turn) => set({ currentTurn: turn })

}));

export default useSessionStore;