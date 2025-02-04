import React, { useState, useEffect } from 'react';
import { Team, Player } from '../../../server/src/types/gameTypes';
import { Socket } from 'socket.io-client';
import io from 'socket.io-client';

const DebugSocketTest = () => {
    const [socket, setSocket] = useState<typeof Socket | null>(null);
    const [sessionId, setSessionId] = useState<string | null>(() => 
        // Initialize from localStorage if available
        localStorage.getItem('sessionId')
    );
    const [gameCode, setGameCode] = useState('');
    const [error, setError] = useState('');
    const [debugLogs, setDebugLogs] = useState<{ timestamp: string; message: string; data: any }[]>([]);
    const [currentGame, setCurrentGame] = useState(null);
    
    const addDebugLog = (message: string, data: any) => {
        setDebugLogs(prev => [{
            timestamp: new Date().toISOString(),
            message,
            data
        }, ...prev].slice(0, 20));
    };

    // Initialize socket connection
    useEffect(() => {
        // Get existing sessionId from localStorage if available
        const existingSessionId = localStorage.getItem('sessionId');
        
        // Connect with the existing sessionId if available
        const newSocket = io('http://localhost:3000', {
            auth: existingSessionId ? { sessionId: existingSessionId } : undefined
        });
        
        newSocket.on('connect', () => {
            addDebugLog('Socket connected', { socketId: newSocket.id });
        });

        newSocket.on('session', (data: { sessionId: string }) => {
            addDebugLog('Session created/restored', data);
            setSessionId(data.sessionId);
            // Store sessionId in localStorage
            localStorage.setItem('sessionId', data.sessionId);
        });

        newSocket.on('error', (error: any) => {
            addDebugLog('Socket error', error);
            setError(error.message);
        });

        setSocket(newSocket);

        return () => {
            newSocket.close();
        };
    }, []);

    const createGame = async (preferredTeam?: Team) => {
        try {
            if (!sessionId) {
                throw new Error('No session ID available');
            }

            addDebugLog('Creating game', { preferredTeam, sessionId });
            
            const res = await fetch('http://localhost:3000/api/games', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    preferredTeam,
                    sessionId 
                })
            });
            
            const rawResponse = await res.text();
            addDebugLog('Raw server response', rawResponse);
            
            let newGame;
            try {
                newGame = JSON.parse(rawResponse);
                addDebugLog('Parsed server response', newGame);
            } catch (parseError) {
                addDebugLog('Failed to parse server response', { error: parseError instanceof Error ? parseError.message : 'Unknown error' });
                throw new Error('Invalid server response format');
            }
            
            if (!res.ok) {
                addDebugLog('Server returned error', { status: res.status, error: newGame.error });
                throw new Error(newGame.error || 'Failed to create game');
            }

            setCurrentGame(newGame);
            setGameCode(newGame.game.gameCode);

            // Join the game room via socket
            socket?.emit('join_game', newGame.game.gameCode);

            addDebugLog('Game created successfully', {
                gameCode: newGame.game.gameCode,
                playerPosition: newGame.playerPosition
            });
            
            setError('');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            setError(errorMessage);
            addDebugLog('Create game error', { error: errorMessage });
        }
    };

    return (
        <div className="p-5">
            <h1 className="text-2xl font-bold mb-5">Debug Socket Test</h1>
            
            <div className="mb-5">
                <div className="mb-3">
                    <strong>Socket Status:</strong> {socket?.connected ? 'Connected' : 'Disconnected'}
                </div>
                <div className="mb-3">
                    <strong>Session ID:</strong> {sessionId || 'Not assigned'}
                </div>
                
                {error && (
                    <div className="p-3 bg-red-100 text-red-700 rounded-md mb-3">
                        {error}
                    </div>
                )}

                <div className="flex gap-3">
                    <button 
                        onClick={() => createGame(Team.Team1)}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md"
                        disabled={!sessionId}
                    >
                        Create (Team 1)
                    </button>
                    <button 
                        onClick={() => createGame(Team.Team2)}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md"
                        disabled={!sessionId}
                    >
                        Create (Team 2)
                    </button>
                </div>
            </div>

            {currentGame && (
                <div className="mb-5 p-3 border rounded-md">
                    <h3 className="font-bold mb-2">Current Game State</h3>
                    <pre className="bg-gray-100 p-3 rounded-md overflow-auto">
                        {JSON.stringify(currentGame, null, 2)}
                    </pre>
                </div>
            )}

            <div>
                <h3 className="font-bold mb-2">Debug Logs</h3>
                <div className="max-h-96 overflow-auto">
                    {debugLogs.map((log, index) => (
                        <div key={index} className="mb-3 p-3 border rounded-md">
                            <div className="text-gray-600">{log.timestamp}</div>
                            <div className="font-bold">{log.message}</div>
                            <pre className="bg-gray-100 p-3 rounded-md mt-2 overflow-auto">
                                {JSON.stringify(log.data, null, 2)}
                            </pre>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DebugSocketTest;