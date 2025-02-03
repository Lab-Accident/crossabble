import React, { useState, useEffect } from 'react';
import { Team, Player } from '../../../server/src/types/gameTypes';
import socketIO, { Socket } from 'socket.io-client';


const TestMongo: React.FC = () => {
    const [status, setStatus] = useState('Loading...');
    const [games, setGames] = useState<Array<{ _id: string; gameCode: string; status: string; createdAt: string }>>([]);
    const [gameCode, setGameCode] = useState('');
    const [error, setError] = useState('');
    const [socketStatus, setSocketStatus] = useState('Disconnected');
    const [socketEvents, setSocketEvents] = useState<Array<{ event: string; data: any; timestamp: string }>>([]);
    const [socket, setSocket] = useState<null | typeof Socket>(null);
    const [currentGame, setCurrentGame] = useState<{
        gameCode: string;
        status: string;
        currentTurn: string;
        score: {
            team1: number;
            team2: number;
        };
        sessionId?: string;
        playerPosition?: string;
    } | null>(null);

    useEffect(() => {
        fetchStatus();
        fetchGames();
    }, []);

    useEffect(() => {
        if (currentGame?.gameCode && currentGame?.sessionId && currentGame?.playerPosition) {
            console.log('Connecting socket with:', {
                gameCode: currentGame.gameCode,
                sessionId: currentGame.sessionId,
                playerPosition: currentGame.playerPosition
            });
            connectSocket(currentGame.gameCode, currentGame.sessionId, currentGame.playerPosition);
        }
    }, [currentGame?.gameCode]);

    const connectSocket = (gameCode: string, sessionId: string, playerPosition: string) => {
        if (socket) {
            socket.disconnect();
        }

        const newSocket = socketIO('http://localhost:3000', {
            auth: {
                gameCode,
                sessionId,
                playerPosition
            },
            reconnectionAttempts: 5,
            reconnectionDelay: 1000
        });

        newSocket.on('connect', () => {
            setSocketStatus('Connected');
            addSocketEvent('connect', { socketId: newSocket.id });
            newSocket.emit('join_game', gameCode);
        });

        newSocket.on('connect_error', (error: Error) => {
            setSocketStatus('Error: ' + error.message);
            addSocketEvent('connect_error', { error: error.message });
        });

        newSocket.on('game_started', (data: { currentTurn: string }) => {
            addSocketEvent('game_started', data);
            if (currentGame) {
                setCurrentGame({
                    ...currentGame,
                    status: 'active',
                    currentTurn: data.currentTurn
                });
            }
        });

        newSocket.on('game_status_update', (data: { status: string; currentTurn?: string }) => {
            addSocketEvent('game_status_update', data);
            if (currentGame) {
                setCurrentGame({
                    ...currentGame,
                    status: data.status,
                    currentTurn: data.currentTurn || currentGame.currentTurn
                });
            }
        });

        newSocket.on('score_update', (data: { team1Score: number; team2Score: number }) => {
            addSocketEvent('score_update', data);
            if (currentGame) {
                setCurrentGame({
                    ...currentGame,
                    score: {
                        team1: data.team1Score,
                        team2: data.team2Score
                    }
                });
            }
        });

        setSocket(newSocket);
    };

    const addSocketEvent = (event: string, data: any) => {
        setSocketEvents(prev => [{
            event,
            data,
            timestamp: new Date().toISOString()
        }, ...prev].slice(0, 50));  // Keep last 50 events
    };

    const fetchStatus = async () => {
        try {
            const res = await fetch('http://localhost:3000/api/health');
            const data = await res.json();
            setStatus(`MongoDB Status: ${data.mongoStatus === 1 ? 'Connected' : 'Disconnected'}`);
        } catch (error) {
            setStatus(`Failed to fetch server status: ${error}`);
            console.error(error);
        }
    };

    const fetchGames = async () => {
        try {
            const res = await fetch('http://localhost:3000/api/games');
            const data = await res.json();
            setGames(data);
        } catch (error) {
            console.error('Failed to fetch games:', error);
        }
    };

    const createGame = async (preferredTeam?: Team) => {
        try {
            const res = await fetch('http://localhost:3000/api/games', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ preferredTeam })
            });
            const newGame = await res.json();
            
            if (!res.ok) {
                throw new Error(newGame.error || 'Failed to create game');
            }

            // Extract the session information from the response
            const gameWithSession = {
                ...newGame,
                sessionId: newGame.yourSessionId,
                playerPosition: newGame.yourPosition
            };

            setCurrentGame(gameWithSession);
            await fetchGames();
            setError('');
        } catch (error) {
            if (error instanceof Error) {
                setError(error.message);
            } else {
                setError('An unknown error occurred');
            }
            console.error('Failed to create game:', error);
        }
    };

    const joinGame = async (gameCodeToJoin: string, preferredTeam?: Team) => {
        try {
            const res = await fetch(`http://localhost:3000/api/games/join/${gameCodeToJoin}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ preferredTeam })
            });
            const gameData = await res.json();
            
            if (!res.ok) {
                throw new Error(gameData.error || 'Failed to join game');
            }

            // Extract the session information from the response
            const gameWithSession = {
                ...gameData,
                sessionId: gameData.yourSessionId,
                playerPosition: gameData.yourPosition
            };

            console.log('Joined game with data:', gameWithSession); // Debug log
            setCurrentGame(gameWithSession);
            await fetchGames();
            setError('');
        } catch (error) {
            if (error instanceof Error) {
                setError(error.message);
            } else {
                setError('An unknown error occurred');
            }
            console.error('Failed to join game:', error);
        }
    };

    const disconnectSocket = () => {
        if (socket) {
            socket.disconnect();
            setSocketStatus('Disconnected');
            setSocket(null);
        }
    };

    const renderCurrentGame = () => {
        if (!currentGame) return null;
    
        return (
            <div className="p-4 border border-gray-300 rounded-lg mt-4">
                <h3 className="text-xl font-bold mb-2">Current Game</h3>
                <p>Game Code: {currentGame.gameCode}</p>
                <p>Status: {currentGame.status}</p>
                <p>Current Turn: {currentGame.currentTurn}</p>
                <p>Session ID: {currentGame.sessionId}</p>
                <p>Player Position: {currentGame.playerPosition}</p>
                <p>Score - Team 1: {currentGame.score.team1}, Team 2: {currentGame.score.team2}</p>
                <button 
                    onClick={disconnectSocket}
                    className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                    Disconnect Socket
                </button>
            </div>
        );
    };

    const renderSocketEvents = () => {
        return (
            <div className="mt-4">
                <h3 className="text-xl font-bold mb-2">Socket Events (Last 50)</h3>
                <p className="mb-2">Socket Status: {socketStatus}</p>
                <div className="max-h-96 overflow-y-auto">
                    {socketEvents.map((event, index) => (
                        <div key={index} className="p-2 border-b border-gray-200">
                            <p className="text-sm text-gray-500">{event.timestamp}</p>
                            <p className="font-medium">{event.event}</p>
                            <pre className="text-sm bg-gray-50 p-2 mt-1 rounded">
                                {JSON.stringify(event.data, null, 2)}
                            </pre>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Game Testing Interface</h1>
            <p className="mb-4">{status}</p>

            {error && (
                <div className="p-4 mb-4 bg-red-100 text-red-700 rounded">
                    {error}
                </div>
            )}

            <div className="mb-6">
                <h2 className="text-xl font-bold mb-2">Create New Game</h2>
                <div className="space-x-2">
                    <button 
                        onClick={() => createGame(Team.Team1)}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Create Game (Team 1)
                    </button>
                    <button 
                        onClick={() => createGame(Team.Team2)}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Create Game (Team 2)
                    </button>
                </div>
            </div>

            <div className="mb-6">
                <h2 className="text-xl font-bold mb-2">Join Game</h2>
                <div className="flex items-center space-x-2">
                    <input
                        type="text"
                        value={gameCode}
                        onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                        placeholder="Enter game code"
                        maxLength={4}
                        className="px-4 py-2 border rounded"
                    />
                    <button 
                        onClick={() => joinGame(gameCode)}
                        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                    >
                        Join Game
                    </button>
                </div>
            </div>

            {renderCurrentGame()}
            {renderSocketEvents()}

            <h2 className="text-xl font-bold mt-6 mb-2">All Games ({games.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {games.map(game => (
                    <div 
                        key={game._id}
                        className="p-4 border border-gray-300 rounded-lg"
                    >
                        <p>Game Code: {game.gameCode}</p>
                        <p>Status: {game.status}</p>
                        <p>Created: {new Date(game.createdAt).toLocaleString()}</p>
                        <button 
                            onClick={() => joinGame(game.gameCode)}
                            className="mt-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                        >
                            Join
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TestMongo;