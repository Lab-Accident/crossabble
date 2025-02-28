import { useCallback, useEffect, useRef } from 'react';
import { Team, GameData, GameSession, Player } from '../../../server/src/types/gameTypes';

interface SocketState {
  connected: boolean;
  sessionId: string | null;
  currentGame: GameSession | null;
  availableGames: GameData[];
  error: string | null;
}

interface SocketActions {
  createGame: (team: Team) => void;
  joinGame: (gameCode: string, team: Team) => void;
}

const DebugSocketTest = ({ socketState, socketActions }: { socketState: SocketState; socketActions: SocketActions }) => {
  const { connected, sessionId, currentGame, availableGames, error } = socketState;
  const { createGame, joinGame } = socketActions;

  const componentId = useRef(Math.random().toString(36).substr(2, 9));
    
  console.log(`[Component Debug] DebugSocketTest ${componentId.current} rendering`, {
      connected: socketState.connected,
      sessionId: socketState.sessionId
  });

  useEffect(() => {
      console.log(`[Component Debug] DebugSocketTest ${componentId.current} mounted`);
      return () => {
          console.log(`[Component Debug] DebugSocketTest ${componentId.current} unmounting`);
      };
  }, []);


  // Memoize handlers
  const handleCreateGame = useCallback((team: Team) => {
    if (sessionId) {
      createGame(team);
    }
  }, [sessionId, createGame]);

  const handleJoinGame = useCallback((gameCode: string, team: Team) => {
    if (sessionId) {
      joinGame(gameCode, team);
    }
  }, [sessionId, joinGame]);

  // Memoize helper function
  const areTeamPositionsTaken = useCallback((game: GameData, team: string) => {
    const player1Key = `${team}P1` as keyof typeof game.players;
    const player2Key = `${team}P2` as keyof typeof game.players;

    return game.players[player1Key]?.connected !== false && 
           game.players[player2Key]?.connected !== false;
  }, []);

  return (
    <div className="debug-container">
      <h1 className="debug-title">Debug Socket Test</h1>
      
      <div className="debug-section">
        <div className="status-info">
          <strong>Socket Status:</strong> {connected ? 'Connected' : 'Disconnected'}
        </div>
        <div className="status-info">
          <strong>Session ID:</strong> {sessionId || 'Not assigned'}
        </div>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {!currentGame && (
          <div className="button-group">
            <button 
              onClick={() => handleCreateGame(Team.Team1)}
              className="create-button"
              disabled={!sessionId}
            >
              Create (Team 1)
            </button>
            <button 
              onClick={() => handleCreateGame(Team.Team2)}
              className="create-button"
              disabled={!sessionId}
            >
              Create (Team 2)
            </button>
          </div>
        )}

        <div className="games-section">
          <h3 className="section-title">Available Games</h3>
          <div className="games-list">
            <div>Available Games: {availableGames.length}</div>
            {availableGames.map((game: GameData) => (
              <div key={game.gameCode} className="game-card">
                <div className="game-info">
                  <div className="game-header">
                    <div>
                      <strong>Game Code:</strong> {game.gameCode}
                      <span className="game-status">
                        <strong>Status:</strong> {game.status}
                      </span>
                    </div>
                    {!currentGame && (
                      <div className="join-buttons">
                        <button
                          onClick={() => handleJoinGame(game.gameCode, Team.Team1)}
                          className="join-button"
                          disabled={!sessionId || areTeamPositionsTaken(game, 'T1')}
                        >
                          Join Team 1
                        </button>
                        <button
                          onClick={() => handleJoinGame(game.gameCode, Team.Team2)}
                          className="join-button"
                          disabled={!sessionId || areTeamPositionsTaken(game, 'T2')}
                        >
                          Join Team 2
                        </button>
                      </div>
                    )}
                  </div>
                  {game.players && (
                    <div className="players-section">
                      <div className="players-title">
                        <strong>Players:</strong>
                      </div>
                      <div className="players-list">
                        {Object.entries({
                          'Team 1 Player 1': game.players.T1P1,
                          'Team 1 Player 2': game.players.T1P2,
                          'Team 2 Player 1': game.players.T2P1,
                          'Team 2 Player 2': game.players.T2P2,
                        }).map(([label, player]) => (
                          <div key={label} className="player-info">
                            {label}: {
                              player.connected === true ?
                                (player.sessionId === sessionId ?
                                  'You' : 'Connected')
                                : 'Empty'
                            }
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {currentGame && (
        <div className="current-game">
          <h3 className="section-title">Current Game State</h3>
          <pre className="game-state">
            {JSON.stringify({
              gameCode: currentGame.gameCode,
              playerPosition: currentGame.playerPosition,
              sessionId: currentGame.sessionId
            }, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default DebugSocketTest;