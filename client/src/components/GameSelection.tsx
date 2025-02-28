import React, { useCallback } from 'react';
import { Team, GameData, GameSession, Player } from '../../../server/src/types/gameTypes';
import '../styles/selection.css';

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

const GameSelection: React.FC<{ socketState: SocketState; socketActions: SocketActions }> = ({ socketState, socketActions }) => {
  const { connected, sessionId, currentGame, availableGames, error } = socketState;
  const { createGame, joinGame } = socketActions;

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

  const areTeamPositionsTaken = useCallback((game: GameData, team: Team) => {
    const player1Key = `${team}P1`;
    const player2Key = `${team}P2` as keyof typeof game.players;
    return game.players[player1Key as keyof typeof game.players]?.connected !== false && 
           game.players[player2Key]?.connected !== false;
  }, []);

  return (
    <div className="screen-container">
      <h1 className="game-title">
        <span className="team1">Cross</span>
        <span className="team2">ABBLE</span>
      </h1>
      
      <div className="menu-container">
        <div className="menu-message T1">
          {connected ? 'CONNECTED' : 'CONNECTING...'}
        </div>
        
        {error && (
          <div className="menu-message T2">
            {error}
          </div>
        )}

        {!currentGame && (
          <div className="options-menu">
            <button 
              onClick={() => handleCreateGame(Team.Team1)}
              className="half-button T2"
              disabled={!sessionId}
            >
              NEW BLUE
            </button>
            <button 
              onClick={() => handleCreateGame(Team.Team2)}
              className="half-button T1"
              disabled={!sessionId}
            >
              NEW GREEN
            </button>
          </div>
        )}

        {availableGames.length > 0 && (
          <div className="clue-title T1">
            Available Games: {availableGames.length}
          </div>
        )}

        {availableGames.map((game) => (
          <div key={game.gameCode} className="game-container">
            <div className="menu-message T1">
              GAME: {game.gameCode} - {game.status.toUpperCase()}
            </div>
            
            {!currentGame && (
              <div className="options-menu">
                <button
                  onClick={() => handleJoinGame(game.gameCode, Team.Team1)}
                  className="half-button T2"
                  disabled={!sessionId || areTeamPositionsTaken(game, Team.Team1)}
                >
                  JOIN BLUE
                </button>
                <button
                  onClick={() => handleJoinGame(game.gameCode, Team.Team2)}
                  className="half-button T1"
                  disabled={!sessionId || areTeamPositionsTaken(game, Team.Team2)}
                >
                  JOIN GREEN
                </button>
              </div>
            )}

            <div className="player-slots">
              <div className={`player-slot T1 ${!game.players.T1P1.connected && 'inactive'}`}>
                B1
              </div>
              <div className={`player-slot T1 ${!game.players.T1P2.connected && 'inactive'}`}>
                B2
              </div>
              <div className={`player-slot T2 ${!game.players.T2P1.connected && 'inactive'}`}>
                G1
              </div>
              <div className={`player-slot T2 ${!game.players.T2P2.connected && 'inactive'}`}>
                G2
              </div>
            </div>
          </div>
        ))}
      </div>

      {currentGame && (
        <div className="menu-container">
          <div className="clue-display T2">
            <pre>
              {JSON.stringify({
                gameCode: currentGame.gameCode,
                playerPosition: currentGame.playerPosition,
                sessionId: currentGame.sessionId
              }, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameSelection;