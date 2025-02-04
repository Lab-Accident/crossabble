import { useEffect } from 'react';
import useSessionStore from './SessionStore';
import useGameStore from './GamePlayStore';

import * as types from '../../../server/src/types/gameTypes';

const SOCKET_URL = 'http://localhost:3000';

export const useGameSocket = () => {
    const { currentSession, setGameStatus, setCurrentTurn } = useSessionStore();
    const { setTeamScores } = useGameStore();
    
    useEffect(() => {
        if (!currentSession?.gameCode) return;

        const socket = io(SOCKET_URL, {
            auth: {
                gameCode: currentSession.gameCode,
                sessionId: currentSession.sessionId,
                playerPosition: currentSession.playerPosition
            },
            reconnectionAttempts: 5,
            reconnectionDelay: 1000
        });

        // Join the game room
        socket.emit('join_game', currentSession.gameCode);
        
        // Game status updates
        socket.on('game_status_update', (data: {
            status: types.GameStatus;
            currentTurn?: string;
        }) => {
            setGameStatus(data.status);
            if (data.currentTurn) {
                setCurrentTurn(data.currentTurn as any);
            }
        });
        
        // Game started event
        socket.on('game_started', (data: {
            currentTurn: string;
        }) => {
            setGameStatus(types.GameStatus.Active);
            setCurrentTurn(data.currentTurn as any);
        });
        
        // Score updates
        socket.on('score_update', (data: {
            team1Score: number;
            team2Score: number;
        }) => {
            setTeamScores(data.team1Score, data.team2Score);
        });

        // Connection handling
        socket.on('connect', () => {
            console.log('Connected to game server');
        });

        socket.on('connect_error', (error: Error) => {
            console.error('Connection error:', error);
        });

        socket.on('reconnect', (attemptNumber: number) => {
            console.log('Reconnected after', attemptNumber, 'attempts');
        });

        return () => {
            socket.disconnect();
        };
    }, [currentSession?.gameCode]);
};
