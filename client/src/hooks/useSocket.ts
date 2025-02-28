import { useEffect, useRef, useState, useMemo } from 'react';
import io from 'socket.io-client';
import {
    Team,
    Player,
    GameData,
    GameSession,
    GameStatus,
} from '../../../server/src/types/gameTypes';

// Constants
const SOCKET_SERVER_URL = 'http://localhost:3000';

const SOCKET_CONFIG = {
    transports: ['websocket'] as string[],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    autoConnect: false
} as const;

// Types
interface SocketState {
    connected: boolean;
    connecting: boolean;
    sessionId: string | null;
    currentGame: GameSession | null;
    availableGames: GameData[];
    error: string | null;
}

interface SocketActions {
    createGame: (preferredTeam: Team, gameSize?: number) => Promise<GameSession | null>;
    joinGame: (gameCode: string, preferredTeam: Team) => Promise<GameSession | null>;
    leaveGame: () => void;
    reconnectToGame: () => Promise<boolean>;
    fetchGames: () => Promise<void>;
}

// Create a singleton socket instance
let globalSocket: any = null;

const getStoredValue = <T>(key: 'SESSION_ID' | 'CURRENT_GAME'): T | null => {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
};

const setStoredValue = (key: 'SESSION_ID' | 'CURRENT_GAME', value: any): void => {
    if (value === null) {
        localStorage.removeItem(key);
    } else {
        localStorage.setItem(key, JSON.stringify(value));
    }
};

const validateCurrentGame = async (currentGame: GameSession | null, sessionId: string | null): Promise<boolean> => {
    if (!currentGame || !sessionId) return false;

    try {
        const response = await fetch(`${SOCKET_SERVER_URL}/api/games`);
        if (!response.ok) return false;
        
        const games: GameData[] = await response.json();
        const game = games.find(g => g.gameCode === currentGame.gameCode);
        
        if (!game) return false;

        const player = game.players[currentGame.playerPosition];
        return Boolean(
            player && 
            player.sessionId === sessionId && 
            player.connected &&
            game.status !== GameStatus.Finished
        );
    } catch (error) {
        console.error('Error validating current game:', error);
        return false;
    }
};

export const useSocket = (): [SocketState, SocketActions] => {
    const [state, setState] = useState<SocketState>(() => {
        const savedSessionId = getStoredValue<string | null>('SESSION_ID');
        const savedGame = getStoredValue<GameSession | null>('CURRENT_GAME');
        
        console.log('[useSocket] Initializing with stored session:', savedSessionId);
        console.log('[useSocket] Initializing with stored game:', savedGame);
        
        return {
            connected: false,
            connecting: false,
            sessionId: savedSessionId,
            currentGame: savedGame,
            availableGames: [],
            error: null
        };
    });

    const sessionChangeCount = useRef(0);
    const lastSessionUpdate = useRef<Date | null>(null);

    useEffect(() => {
        if (state.sessionId) {
            sessionChangeCount.current += 1;
            lastSessionUpdate.current = new Date();
            
            console.log(
                `[useSocket] Session ID changed (#${sessionChangeCount.current}): ${state.sessionId}`, 
                `at ${lastSessionUpdate.current.toISOString()}`
            );
        }
    }, [state.sessionId]);
    
    useEffect(() => {
        const validateGame = async () => {
            console.log('[useSocket] Validating current game with session', state.currentGame, state.sessionId);
            const isValid = await validateCurrentGame(state.currentGame, state.sessionId);
            console.log('[useSocket] Game validation result:', isValid);

            if (!isValid && state.currentGame) {
                console.warn('[useSocket] Current game is invalid, clearing game state');
                setStoredValue('CURRENT_GAME', null);
                setState(prev => ({ ...prev, currentGame: null }));
            }
        };
        validateGame();
    }, [state.sessionId]);

    // Memoize the socket configuration
    const socketConfig = useMemo(() => {
        const config = {
            ...SOCKET_CONFIG,
            auth: state.sessionId ? { sessionId: state.sessionId } : undefined
        };
        console.log('[useSocket] Socket config updated:', config);
        return config;
    }, [state.sessionId]);

    // Initialize socket connection
    useEffect(() => {
        console.log('[useSocket] Socket connection effect triggered', { 
            connected: globalSocket?.connected, 
            sessionId: state.sessionId 
        });

        if (globalSocket?.connected) {
            console.log('[useSocket] Already connected, setting state');
            setState(prev => ({ ...prev, connected: true, connecting: false }));
            return;
        }

        if (!globalSocket) {
            console.log('[useSocket] Creating new socket instance');
            setState(prev => ({ ...prev, connecting: true }));
            globalSocket = io(SOCKET_SERVER_URL, socketConfig);
        } else if (globalSocket && !globalSocket.connected) {
            console.log('[useSocket] Socket exists but not connected, connecting now');
            // Re-authenticate if session ID changed
            if (globalSocket.auth?.sessionId !== state.sessionId) {
                console.log('[useSocket] Auth sessionId updated from', 
                    globalSocket.auth?.sessionId, 'to', state.sessionId);
                globalSocket.auth = { sessionId: state.sessionId };
            }
        }


        const handleConnect = () => {
            console.log('[useSocket] Socket connected');
            setState(prev => ({ ...prev, connected: true, connecting: false, error: null }));
        };

        const handleDisconnect = (reason: string) => {
            console.log('[useSocket] Socket disconnected:', reason);
            setState(prev => ({ ...prev, connected: false }));
        };

        const handleSession = ({ sessionId }: { sessionId: string }) => {
            console.log('[useSocket] Session received from server:', sessionId,
                'current:', state.sessionId,
                'different:', sessionId !== state.sessionId);
                 
            if (sessionId !== state.sessionId) {
                console.log('[useSocket] Updating session ID from server:', sessionId);
                setStoredValue('SESSION_ID', sessionId);
                setState(prev => ({ ...prev, sessionId }));
            }
        };

        const handleError = (error: any) => {
            console.error('[useSocket] Socket error:', error);
            setState(prev => ({ ...prev, error: error.message || 'Socket error' }));
        };

        const handleGameStateUpdate = (gameState: GameData) => {
            console.log('[useSocket] Game state update received:', gameState.gameCode);
            setState(prev => {
                const newGames = prev.availableGames
                    .filter(g => g.gameCode !== gameState.gameCode)
                    .concat([gameState]);
    
                if (!prev.currentGame || !prev.sessionId) {
                    return { ...prev, availableGames: newGames };
                }
    
                const isCurrentGameValid = 
                    gameState.gameCode === prev.currentGame.gameCode &&
                    gameState.status !== GameStatus.Finished &&
                    gameState.players[prev.currentGame.playerPosition]?.sessionId === prev.sessionId &&
                    gameState.players[prev.currentGame.playerPosition]?.connected;
    
                console.log('[useSocket] Current game validation:', {
                    isValid: isCurrentGameValid,
                    gameCodeMatch: gameState.gameCode === prev.currentGame.gameCode,
                    notFinished: gameState.status !== GameStatus.Finished,
                    sessionMatch: gameState.players[prev.currentGame.playerPosition]?.sessionId === prev.sessionId,
                    connected: gameState.players[prev.currentGame.playerPosition]?.connected
                });
    
                if (!isCurrentGameValid) {
                    console.warn('[useSocket] Current game is no longer valid, clearing');
                    setStoredValue('CURRENT_GAME', null);
                    return {
                        ...prev,
                        availableGames: newGames,
                        currentGame: null
                    };
                }
    
                return { ...prev, availableGames: newGames };
            });
        };

        const handleGameListUpdate = (games: GameData[]) => {
            console.log('[useSocket] Game list update received with', games.length, 'games');
            
            setState(prev => {
                // If we're in a game, make sure our current game is properly represented
                if (prev.currentGame && prev.sessionId) {
                    const currentGameInList = games.find(g => g.gameCode === prev.currentGame?.gameCode);
                    
                    if (currentGameInList) {
                        const isCurrentGameValid = 
                            currentGameInList.status !== GameStatus.Finished &&
                            currentGameInList.players[prev.currentGame.playerPosition]?.sessionId === prev.sessionId &&
                            currentGameInList.players[prev.currentGame.playerPosition]?.connected;
                        
                        if (!isCurrentGameValid) {
                            console.warn('[useSocket] Current game is no longer valid in game list update, clearing');
                            setStoredValue('CURRENT_GAME', null);
                            return { ...prev, availableGames: games, currentGame: null };
                        }
                    } else {
                        // Our game isn't in the list anymore
                        console.warn('[useSocket] Current game no longer exists in game list update, clearing');
                        setStoredValue('CURRENT_GAME', null);
                        return { ...prev, availableGames: games, currentGame: null };
                    }
                }
                
                return { ...prev, availableGames: games };
            });
        };

        globalSocket.on('connect', handleConnect);
        globalSocket.on('disconnect', handleDisconnect);
        globalSocket.on('session', handleSession);
        globalSocket.on('gameStateUpdate', handleGameStateUpdate);
        globalSocket.on('error', handleError);
        globalSocket.on('gameListUpdate', handleGameListUpdate);

        if (!globalSocket.connected) {
            console.log('[useSocket] Connecting socket');
            globalSocket.connect();
        }

        return () => {
            console.log('[useSocket] Cleaning up socket event listeners');
            globalSocket.off('connect', handleConnect);
            globalSocket.off('disconnect', handleDisconnect);
            globalSocket.off('session', handleSession);
            globalSocket.off('gameStateUpdate', handleGameStateUpdate);
            globalSocket.off('error', handleError);
            globalSocket.off('gameListUpdate', handleGameListUpdate);
        };
    }, [socketConfig]);

    // Actions
    const actions: SocketActions = useMemo(() => ({
        createGame: async (preferredTeam: Team, gameSize: number = 15) => {
            if (!state.sessionId || !globalSocket?.connected) {
                throw new Error('Not connected to server');
            }

            try {
                const response = await fetch(`${SOCKET_SERVER_URL}/api/games`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ preferredTeam, sessionId: state.sessionId, gameSize })
                });

                if (!response.ok) throw new Error('Failed to create game');

                const { game, playerPosition } = await response.json();
                
                globalSocket.emit('joinGame', { 
                    gameCode: game.gameCode,
                    playerPosition,
                    preferredTeam 
                });
                
                const gameSession = {
                    gameCode: game.gameCode,
                    playerPosition,
                    sessionId: state.sessionId
                };

                setStoredValue('CURRENT_GAME', gameSession);
                setState(prev => ({ ...prev, currentGame: gameSession }));
                return gameSession;
            } catch (error) {
                setState(prev => ({ 
                    ...prev, 
                    error: error instanceof Error ? error.message : 'Failed to create game' 
                }));
                return null;
            }
        },

        joinGame: async (gameCode: string, preferredTeam: Team) => {
            if (!state.sessionId || !globalSocket?.connected) {
                throw new Error('Not connected to server');
            }

            try {
                const response = await fetch(`${SOCKET_SERVER_URL}/api/games/join/${gameCode}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ preferredTeam, sessionId: state.sessionId })
                });

                if (!response.ok) throw new Error('Failed to join game');

                const { game, playerPosition } = await response.json();
                
                globalSocket.emit('joinGame', { 
                    gameCode: game.gameCode,
                    playerPosition,
                    preferredTeam 
                });
        
                const gameSession = {
                    gameCode: game.gameCode,
                    playerPosition,
                    sessionId: state.sessionId
                };

                setStoredValue('CURRENT_GAME', gameSession);
                setState(prev => ({ ...prev, currentGame: gameSession }));
                return gameSession;
            } catch (error) {
                setState(prev => ({ 
                    ...prev, 
                    error: error instanceof Error ? error.message : 'Failed to join game' 
                }));
                return null;
            }
        },

        leaveGame: () => {
            if (state.currentGame && globalSocket?.connected) {
                globalSocket.emit('leaveGame', { gameCode: state.currentGame.gameCode });
            }
            setStoredValue('CURRENT_GAME', null);
            setState(prev => ({ ...prev, currentGame: null }));
        },

        reconnectToGame: async () => {
            if (!state.currentGame?.gameCode || !state.sessionId || !globalSocket?.connected) {
                return false;
            }

            try {
                const response = await fetch(
                    `${SOCKET_SERVER_URL}/api/games/reconnect/${state.currentGame.gameCode}`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            sessionId: state.sessionId,
                            playerPosition: state.currentGame.playerPosition
                        })
                    }
                );

                if (!response.ok) throw new Error('Failed to reconnect to game');

                const gameState: GameData = await response.json();
                
                const gameSession = {
                    gameCode: gameState.gameCode,
                    playerPosition: state.currentGame.playerPosition,
                    sessionId: state.sessionId
                };

                setStoredValue('CURRENT_GAME', gameSession);
                setState(prev => ({ ...prev, currentGame: gameSession }));
                return true;
            } catch (error) {
                setState(prev => ({ 
                    ...prev, 
                    error: error instanceof Error ? error.message : 'Failed to reconnect' 
                }));
                return false;
            }
        },

        fetchGames: async () => {
            try {
                const response = await fetch(`${SOCKET_SERVER_URL}/api/games`);
                if (!response.ok) throw new Error('Failed to fetch games');
                
                const games: GameData[] = await response.json();
                setState(prev => ({ ...prev, availableGames: games }));
            } catch (error) {
                setState(prev => ({ 
                    ...prev, 
                    error: error instanceof Error ? error.message : 'Failed to fetch games' 
                }));
            }
        }
    }), [state.sessionId, state.currentGame]);

    return [state, actions];
};

// Helper functions
export const getCurrentTeam = (): string | null => {
    const gameData = localStorage.getItem('CURRENT_GAME');
    if (!gameData) return null;
    const game = JSON.parse(gameData);
    return game?.playerPosition?.slice(0, 2) || null;
};

export const getCurrentPlayer = (): Player | null => {
    const gameData = localStorage.getItem('CURRENT_GAME');
    if (!gameData) return null;
    const game = JSON.parse(gameData);
    return game?.playerPosition || null;
};